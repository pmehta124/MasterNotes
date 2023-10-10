import {
    Card,
    CardBody,
   
  } from "@material-tailwind/react";
  import Markdown from "react-markdown";
  export default function PersonalNoteCard(props) {
    const { note } = props;
    const title = note.content.split("\n")[0];
    const content = note.content.split("\n").slice(1).join("\n");
    const id = note._id;
    return (
      <Card className="w-80 h-64 m-4 bg-blue-200 hover:bg-blue-300">
        <CardBody className="h-[60%] overflow-auto">
          <Markdown className={"prose"}>{title.length>30?title.slice(0,30)+"...":title}</Markdown>
          <Markdown className={"prose"}>
            {content}
          </Markdown>
        </CardBody>
      </Card>
    );
  }