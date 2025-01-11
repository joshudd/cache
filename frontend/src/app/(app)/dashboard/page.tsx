"use client";

import TransitionChild from "@/components/transition/transition-child";
import { Button } from "@/components/ui/button";
import RecentSummary from "@/components/widgets/recent-summary";
import Suggestions from "@/components/widgets/suggestions";
import WeekSummary from "@/components/widgets/week";
import Playlists from "@/components/spotify/playlists";
import { useEffect, useState } from "react";
import { getUniqueRecommendations } from "@/lib/spotify";
import RecentCaches from "@/components/widgets/recent-caches";

export default function Dashboard() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // const fetchRecommendations = async () => {
  //   try {
  //     const data = await getUniqueRecommendations();
  //     setRecommendations(data);
  //   } catch (error) {
  //     console.error("Error fetching recommendations:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   fetchRecommendations();
  // }, []);

  return (
    <TransitionChild id="dashboard">
      <div className="flex justify-center w-full p-8 pt-16 pb-20 sm:p-20 sm:pt-20">
        <div className="w-full max-w-3xl overflow-hidden relative">
          <div className="flex flex-col gap-16">
            <Widget title="Last heard">
              <RecentSummary />
            </Widget>
            <Widget title="Recent caches">
              <RecentCaches />
            </Widget>
            {/* <Widget title="Suggestions">
              <Suggestions />
            </Widget> */}
            {/* <Widget title="Buried this week">
              <WeekSummary />
            </Widget> */}
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
