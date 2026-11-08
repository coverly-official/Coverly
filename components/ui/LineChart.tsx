interface LineChartProps {
  className?: string;
  color?: string;
  secondaryColor?: string;
}

export function LineChart({ className, color = "#f9b17a", secondaryColor = "#eef0f7" }: LineChartProps) {
  const ref = useRef<SVGSVGElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  const points = [
    { x: 0, y: 80 },
    { x: 50, y: 60 },
    { x: 100, y: 40 },
    { x: 150, y: 30 },
    { x: 200, y: 20 },
    { x: 250, y: 10 },
    { x: 300, y: 80 }
  ];

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <svg
      ref={ref}
      viewBox="0 0 300 80"
      fill="none"
      className={cn("w-full", className)}
    >
      <path
        d={pathD}
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-700 ease-out"
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? "translateY(0)" : "translateY(4px)",
          transitionDelay: `${delay}ms`
        }}
      />
    </svg>
  );
}
