export default function BackgroundGradientDemo() {
  return (
    <div className="fixed inset-0 -z-10 bg-[#020617]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_40%_-10%,rgba(16,185,129,0.3),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_60%_120%,rgba(239,68,68,0.25),transparent)]" />
    </div>
  );
}
