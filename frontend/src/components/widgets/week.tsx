import dayjs from "dayjs";

export default function WeekSummary() {
  return (
    <div className="bg-secondary rounded-lg p-4">
      <div className="flex flex-col gap-2">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="flex justify-between items-center"
          >
            <p className="text-sm text-muted-foreground">
              {dayjs().subtract(index, "day").format("dddd")}
            </p>
            <p className="text-sm text-muted-foreground">
              {Math.floor(Math.random() * 10)} songs
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
