interface FadeUpProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section" | "article";
}

export function FadeUp({
  children,
  delay = 0,
  className,
  as = "div",
  ...props
}: FadeUpProps) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    const element = document.querySelector(`[${dataAttributes.fadeUp}]`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, []);

  const Component = as;

  return (
    <Component
      className={cn(
        "transition-all duration-700 ease-out",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
