import { cn } from "@/lib/utils";
import avatar from "public/Dastaran.svg?url";

type Props = React.ComponentProps<"img">;

export default function Avatar({ className, ...props }: Props) {
  return (
    <img
      {...props}
      className={cn("object-cover", className)}
      alt="Avatar"
      title="Profile image"
      src={avatar}
      fetchPriority="high"
    />
  );
}
