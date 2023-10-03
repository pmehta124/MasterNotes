
const Group = require('../models/GroupModel');
const User = require('../models/UserModel');
const LectureDate = require('../models/LectureDateModel');
const Notification = require('../models/NotificationModel');

async function CreateGroupHandler(req, res) {
    const {name, courseNumber, courseTitle, instructor, location, startTime, endTime, startDate, endDate, weekdays, description, inviteOnly, dates} = req.body;
  

    try {
        const group = await Group.create({
            name: name,
            courseNumber: courseNumber,
            courseTitle: courseTitle,
            instructor: instructor,
            location: location,
            startTime: startTime,
            endTime: endTime,
            startDate: startDate,
            endDate: endDate,
            weekdays: weekdays,
            description: description,
            inviteOnly: inviteOnly,
            owner: req.userId
        });

        /**
         * Create lecture dates for the group
         * lecture dates will store notes later
         */
        const lectureDates = [];

        for (let i = 0; i < dates.length; i++) {
            const lectureDate = await LectureDate.create({
                date: dates[i],
                group: group._id
            });
            lectureDates.push(lectureDate._id);
        }
        await group.updateOne({$push: {dates: lectureDates, members: [req.userId]}});
        await User.findByIdAndUpdate(req.userId, {$push: {groups: group._id}});
        res.status(201).json(group);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({message: err.message});
    }  
}

async function GetAllGroupsHandler (req, res) {
    try{
    const groupIds = await User.findById(req.userId).select("groups");
    const groups = await Group.find({
        '_id': { $in: groupIds.groups}
    });

    console.log(groupIds);
    res.status(200).json(groups);

}
catch (err) {
    console.log(err);
    res.status(500).json({message: err.message});   
}
}

async function GetGroupByIdHandler (req,res){
    try {
        const group = await Group.findById(req.params.id);
        const lectureDates = await LectureDate.find({
            '_id': { $in: group.dates}
        });
        group.dates = lectureDates;

        res.status(200).json(group);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({message: err.message});
    }
}

async function CreateGroupInviteHandler(req, res) {
    
    const {groupId, emails,message} = req.body
    console.log(req.body)
    const group = Group.findById(groupId);
    if (!group){
        return res.status(404).json({message: "Group not found"});
    }
    try{
        /***
         *  Check if the groupId is valid
         *  if the groupId is valid,
         *     Check if the actor(the user who is making the group invite) is a member of the group
         */

        const group = await Group.findById(groupId);
        if (!group){
            return res.status(404).json({message: "Group not found"});
        }
        const actor = await User.findById(req.userId);
        const isMember =  await Group.findOne({_id: groupId, members: req.userId});
        if (!isMember){
            return res.status(401).json({message: "Unauthorized"});
        }
        console.log(actor);
        const text = `${actor.firstName} ${actor.lastName} invited you to join ${group.name}`;

    /***
         *  for each email, check if the user is registered
         *  if the user is registered,
         *      create a notification for the user if the user is not a member of the group
         *      update the notification if the user is already invited to the group
         *      disregard if the user is already a member of the group
         *  if the user is not registered,
         *     create a notification (type:"GroupInvite") for the email
         */
        
        emails.map (async (email)=>
        {
            const user = await User.findOne({email: email});


            if (user){
                const isMember = group.members.includes(user._id);
                /**
                 * Check if the user  or the email is already invited to the group
                 * Need to check both user and email because it is possible that the user is registered after the invitation
                 */

                const isInvited = await Notification.findOne({$or: [{user: user._id}, {email: email}], group: group._id, type: "GroupInvite"});
                if (!isMember && !isInvited){
                    const notification = await Notification.create({
                        text: text,
                        message: message,
                        type: "GroupInvite",
                        group: group._id,
                        actor: actor._id,
                        user: user._id
                    });
                    await group.updateOne({$push: {invites: user._id}});
                    await user.updateOne({$push: {notifications: notification._id}});
                }
                else if (!isMember && isInvited){
                    await isInvited.updateOne({message: message, actor: actor._id, user: user._id, text: text, email: user.email, read: false});
                }
            }
            else{
                // Check if invitation for the email already exists
                const isInvited = await Notification.findOne({email: email, group: group._id, type: "GroupInvite"});
                if (!isInvited){
                    await Notification.create({
                        text: text,
                        message: message,
                        type: "GroupInvite",
                        group: group._id,
                        actor: actor._id,
                        email: email
                    });
                }
                else{
                    await isInvited.updateOne({message: message, actor: actor._id, text: text, read: false});
                }
            }

        })
        return res.status(201).json({message: "Invite sent"});
    }catch(err){
        console.log(err);
        return res.status(500).json({message: err.message});
    }
    


}

async function JoinGroupHandler(req, res) {
    console.log(req.params);
    const groupId = req.params.id;
    try {
        const group = await Group.findById(groupId);
        if (!group){
            return res.status(404).json({message: "Group not found"});
        }
        // check if the user is already a member of the group
        const isMember = await Group.findOne({_id: groupId, members: req.userId});
        if (isMember){
            return res.status(200).json({message: "You are already a member of the group"});
        }
        /**
         * Check if the group is inviteOnly
         * if the group is not inviteOnly, add the user to the group
         */
        if (!group.inviteOnly){
            await group.updateOne({$push: {members: req.userId}});
            await User.findByIdAndUpdate(req.userId, {$push: {groups: group._id}});
            return res.status(201).json({message: `Joined ${group.name}`});
        }
        const isInvited = await Notification.findOne({email: req.email, group: group._id, type: "GroupInvite"});
        if (!isInvited){
            return res.status(401).json({message: "Unauthorized"});
        }
        const user = await User.findOne({email: req.email});
        await group.updateOne({$push: {members: user._id}});
        await user.updateOne({$push: {groups: group._id}});
        await isInvited.deleteOne();
        return res.status(201).json({message: `Joined ${group.name}`});
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({message: err.message});
    }
}

async function LeaveGroupHandler(req, res) {
    const groupId = req.params.id;
    try {
        const group = await Group.findById(groupId);
        if (!group){
            return res.status(404).json({message: "Group not found"});
        }
        // check if the user is a member of the group
        const isMember = await Group.findOne({_id: groupId, members: req.userId});
        if (!isMember){
            return res.status(200).json({message: "You are not a member of the group"});
        }
        await group.updateOne({$pull: {members: req.userId}});
        await User.findByIdAndUpdate(req.userId, {$pull: {groups: group._id}});
        return res.status(201).json({message: `Left ${group.name}`});
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({message: err.message});
    }
}


module.exports = {
    CreateGroupHandler,
    GetAllGroupsHandler,
    GetGroupByIdHandler,
    CreateGroupInviteHandler,
    JoinGroupHandler,
    LeaveGroupHandler
};