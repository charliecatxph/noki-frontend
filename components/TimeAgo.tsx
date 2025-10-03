import React from "react";
import { format } from "timeago.js";

const TimeAgoComponent = ({ timestamp }: { timestamp: string }) => {
  return <span>{format(timestamp)}</span>;
};

export default TimeAgoComponent;
