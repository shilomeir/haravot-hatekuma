import { HeroSection } from '@/components/home/HeroSection'
import { ModesGrid } from '@/components/home/ModesGrid'
import { RankPanel } from '@/components/home/RankPanel'
import { StreakCard } from '@/components/home/StreakCard'
import { DailyCard } from '@/components/home/DailyCard'

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-10">
      {/* Main bento grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left: hero + modes */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <HeroSection />
          <DailyCard />
          <ModesGrid />
        </div>

        {/* Right: progress + streak */}
        <div className="space-y-4">
          <StreakCard />
          <RankPanel />
        </div>
      </div>
    </div>
  )
}
