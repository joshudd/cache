"use client";

import { Button } from "@/components/ui/button";
import RecentSummary from "@/components/widgets/recent-summary";
import Suggestions from "@/components/widgets/suggestions";
import WeekSummary from "@/components/widgets/week";

export default function Dashboard() {
  const testApi = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/caches/`,
        {
          credentials: "include",
        }
      );
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <div className="flex justify-center w-full p-8 pt-16 pb-20 sm:p-20 sm:pt-20">
      <div className="w-full max-w-3xl overflow-hidden relative">
        <div className="flex flex-col gap-16">
          <Widget title="testing button">
            <Button onClick={testApi}>test</Button>
          </Widget>
          <Widget title="Earlier today">
            <RecentSummary />
          </Widget>
          <Widget title="Potential stash">
            <Suggestions />
          </Widget>
          <Widget title="Buried this week">
            <WeekSummary />
          </Widget>
        </div>
      </div>
    </div>
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
