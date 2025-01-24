"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// convert path to breadcrumb segments
const getPathSegments = (path: string) => {
  // remove leading/trailing slashes and split
  const segments = path.replace(/^\/+|\/+$/g, "").split("/");
  // filter out app route group markers
  return segments.filter((segment) => !segment.startsWith("("));
};

export default function PageBreadcrumb() {
  const pathname = usePathname();
  const segments = getPathSegments(pathname);

  // no breadcrumbs needed for root
  if (segments.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          // build up the path for this segment
          const path = `/${segments.slice(0, index + 1).join("/")}`;
          
          return (
            <React.Fragment key={path}>
              <BreadcrumbItem>
                <BreadcrumbLink href={path} className="text-light-grey">
                  {segment}
                </BreadcrumbLink>
              </BreadcrumbItem>
              {index < segments.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
} 