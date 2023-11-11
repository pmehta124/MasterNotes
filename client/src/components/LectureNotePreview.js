import {
    Card,
    CardBody
  } from "@material-tailwind/react";
  import Markdown from "react-markdown";
  import remarkGfm from "remark-gfm";
  import PersonIcon from '@mui/icons-material/Person';
  import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
  import ThumbDownAltIcon from '@mui/icons-material/ThumbDownAlt';
  import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
  import { Chip } from "@mui/material";
  export default function LectureNotePreview(props) {
    const { title, content,id,author, upvotes,downvotes, inPersonalBranch=false, tags
    } = props;

    return (
      <Card className="mt-6  h-80 group  m-4 bg-gray-200 hover:bg-gray-300  " 
      onClick={
        () => {
            window.location.href = `/lectureNote/${id}`
        }}
      >
        <CardBody className="  overflow-auto">
          <Markdown className={"prose"} remarkPlugins={[remarkGfm]}>{title.length>30?title.slice(0,30)+"...":title}</Markdown>
          <Markdown className={"prose"} remarkPlugins={[remarkGfm]}>
            {content}
          </Markdown>
          
          <div className="absolute  flex justify-end items-center w-full bottom-0 right-0  h-10 bg-white  rounded-b-xl">
            
            {tags && tags.length>0 &&
              <div className="hidden group-hover:block overflow-x-scroll">
                
                {tags.length<=2?
                tags.map((tag) => (
                  <Chip label={tag.name}
                  sx={{ backgroundColor: tag.color, color: "white", marginRight:1}} />
                ))
                :
                <>
               {tags.slice(0,2).map((tag) => (
                  <Chip label={tag.name}
                  sx={{ backgroundColor: tag.color, color: "white", marginRight:1}} />
                ))}
                <Chip label={`+${tags.length-2}`}
                  sx={{ backgroundColor: "gray", color: "white", marginRight:1}} />
                </>}
              </div>
              
            }
            <PersonIcon sx={{ fontSize: 15, color: "blue" }} />
            <p className="text-sm mr-4">{author}</p>
            <ThumbUpAltIcon sx={{ fontSize: 15, color: "green" }} />
            <p className="text-sm mr-4">{upvotes}</p>
            <ThumbDownAltIcon sx={{ fontSize: 15, color: "gray" }} />
            <p className="text-sm mr-4">{downvotes}</p>
            {inPersonalBranch&&
            <>
            <PlaylistAddCheckIcon sx={{ fontSize: 15, color: "blue" }} />
            <p className="text-sm mr-4">In Personal Branch</p>
            </>}



          </div>
        </CardBody>
      </Card>
    );
  }