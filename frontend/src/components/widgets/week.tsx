import dayjs from "dayjs";

export default function WeekSummary() {
  return (
    <div className="w-full flex">
      <div className="w-fit bg-secondary p-10 rounded-tl-[16px] rounded-br-[16px] border-l-4 border-t-4 border-[#abbd38]">
        <div className="flex flex-row gap-6">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="flex flex-col items-center gap-3">
              <div
                className={`w-8 h-8 rounded-md`}
                style={{
                  backgroundColor: getActivityColor(
                    Math.floor(Math.random() * 10)
                  ),
                }}
              />
              <p className="text-base text-muted-foreground">
                {getDayLabel(
                  dayjs()
                    .subtract(6 - index, "day")
                    .format("d")
                    .toLowerCase()
                )}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getActivityColor(count: number): string {
  if (count === 0) return "rgba(128, 128, 128, 0.1)";
  if (count <= 3) return "rgba(228, 86, 93, 0.3)";
  if (count <= 6) return "rgba(228, 86, 93, 0.5)";
  if (count <= 9) return "rgba(228, 86, 93, 0.7)";
  return "#E4565D";
}

function getDayLabel(day: string): string {
  switch (day) {
    case "1":
      return "m";
    case "2":
      return "t";
    case "3":
      return "w";
    case "4":
      return "th";
    case "5":
      return "f";
    case "6":
      return "s";
    case "0":
      return "su";
    default:
      return day;
  }
}
