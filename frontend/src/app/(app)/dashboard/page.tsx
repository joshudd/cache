"use client";

import TransitionChild from "@/components/transition/transition-child";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import RecentlyListened from "@/components/widgets/recently-listened";
import RecentlySealed from "@/components/widgets/recently-sealed";
import AvailableTracks from "@/components/widgets/available-tracks";
import ReadyTracks from "@/components/widgets/ready-tracks";
import InfoTip from "@/components/widgets/info-tip";

export default function Dashboard() {
  return (
    <TransitionChild id="dashboard">
      <div className="flex justify-center w-full p-8 pt-16 pb-20 sm:p-20 sm:pt-20">
        <div className="w-full max-w-3xl overflow-hidden relative">
          <div className="flex justify-between items-center">
            <PageBreadcrumb />
            <InfoTip />
          </div>
          {/* <h1 className="text-3xl font-bold mt-4 mb-8">Hello, {username}</h1> */}
          <div className="flex flex-col gap-16 mt-8">
            <Widget title="Ready for playlist">
              <ReadyTracks />
            </Widget>
            <Widget title="Recently played">
              <RecentlyListened />
            </Widget>
            <Widget title="Recently sealed">
              <RecentlySealed />
            </Widget>
            <Widget title="Available tracks">
              <AvailableTracks />
            </Widget>
          </div>
        </div>
      </div>
    </TransitionChild>
  );
}

function Widget({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">{title}</h2>
      {children}
    </div>
  );
}
