import { HeroSection } from '@/components/home/HeroSection'
import { ModesGrid } from '@/components/home/ModesGrid'
import { RankPanel } from '@/components/home/RankPanel'
import { StreakCard } from '@/components/home/StreakCard'

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - hero + modes */}
        <div className="lg:col-span-2 space-y-8">
          <HeroSection />
          <ModesGrid />
        </div>

        {/* Right column - rank panel + streak */}
        <div className="space-y-4">
          <StreakCard />
          <RankPanel />
        </div>
      </div>
    </div>
  )
}
