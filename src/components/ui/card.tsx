import { ReactNode } from "react";
import clsx from "clsx";

type Props = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: Props) {
  return <div className={clsx("rounded-card bg-white p-4 shadow-soft", className)}>{children}</div>;
}
