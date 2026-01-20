import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-loam-neutral">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            HomeRun to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-loam-brown to-loam-green">
              Happiness
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8">
            Discover your deepest WHY using AI-powered coaching and The 5 Whys methodology.
            Build a clear path to the life you truly want.
          </p>
          <Link
            to="/assessment"
            className="inline-block bg-loam-brown text-white px-8 py-4 rounded-loam text-lg font-semibold hover:bg-loam-brown/90 focus:outline-none focus:ring-2 focus:ring-loam-brown focus:ring-offset-2 transition shadow-lg hover:shadow-xl"
          >
            Start Your Journey
          </Link>
        </div>

        {/* Framework Explanation */}
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            The HomeRun Framework
          </h2>
          <div className="bg-loam-neutral rounded-loam p-8 mb-12 border border-loam-clay/20">
            <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap">
              {/* AT BAT - Blue Circle */}
              <div className="w-24 h-24 md:w-32 md:h-32 bg-loam-brown rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm md:text-base text-center px-2">AT BAT</span>
              </div>
              
              {/* Arrow */}
              <div className="text-gray-400 text-2xl md:text-3xl">›</div>
              
              {/* 1ST BASE - Green Rounded Rectangle */}
              <div className="bg-loam-green rounded-loam px-4 py-3 md:px-6 md:py-4 shadow-lg min-w-[100px] md:min-w-[120px]">
                <span className="text-white font-bold text-sm md:text-base">1ST BASE</span>
              </div>
              
              {/* Arrow */}
              <div className="text-gray-400 text-2xl md:text-3xl">›</div>
              
              {/* 2ND BASE - Green Rounded Rectangle */}
              <div className="bg-loam-green rounded-loam px-4 py-3 md:px-6 md:py-4 shadow-lg min-w-[100px] md:min-w-[120px]">
                <span className="text-white font-bold text-sm md:text-base">2ND BASE</span>
              </div>
              
              {/* Arrow */}
              <div className="text-gray-400 text-2xl md:text-3xl">›</div>
              
              {/* 3RD BASE - Green Rounded Rectangle */}
              <div className="bg-loam-green rounded-loam px-4 py-3 md:px-6 md:py-4 shadow-lg min-w-[100px] md:min-w-[120px]">
                <span className="text-white font-bold text-sm md:text-base">3RD BASE</span>
              </div>
              
              {/* Arrow */}
              <div className="text-gray-400 text-2xl md:text-3xl">›</div>
              
              {/* HOME - Green Diamond */}
              <div className="bg-loam-green w-20 h-20 md:w-24 md:h-24 transform rotate-45 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xs md:text-sm transform -rotate-45 text-center">HOME</span>
              </div>
            </div>
          </div>
          
          {/* Stage Descriptions */}
          <div className="grid md:grid-cols-5 gap-4 mb-12">
            {[
              { label: 'At Bat', desc: 'Discover WHY' },
              { label: 'First Base', desc: 'Discover WHO' },
              { label: 'Second Base', desc: 'Discover WHAT' },
              { label: 'Third Base', desc: 'Map HOW' },
              { label: 'Home Plate', desc: 'Why it MATTERS' },
            ].map((stage) => (
              <div
                key={stage.label}
                className="text-center"
              >
                <h3 className="font-semibold text-gray-900 mb-1">{stage.label}</h3>
                <p className="text-sm text-gray-600">{stage.desc}</p>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              What You'll Discover
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: 'Direct AI Coaching',
                  desc: 'Get honest, no-BS feedback from an AI coach who pushes you deeper.',
                },
                {
                  title: 'The 5 Whys Method',
                  desc: 'Ask "why" 5 times to reach your root motivation and truth.',
                },
                {
                  title: 'Vague Answer Detection',
                  desc: 'Get called out on surface-level answers and forced to dig deeper.',
                },
                {
                  title: 'Progress Tracking',
                  desc: 'Visualize your journey through the bases with clear milestones.',
                },
              ].map((feature) => (
                <div key={feature.title} className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-loam-brown rounded-loam flex items-center justify-center text-white font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                    <p className="text-sm text-gray-600">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <p className="text-lg text-gray-600 mb-6">
            Ready to discover what truly drives you?
          </p>
          <Link
            to="/assessment"
            className="inline-block bg-loam-green text-white px-8 py-4 rounded-loam text-lg font-semibold hover:bg-loam-green/90 focus:outline-none focus:ring-2 focus:ring-loam-green focus:ring-offset-2 transition shadow-lg hover:shadow-xl"
          >
            Take the Assessment
          </Link>
        </div>
      </div>
    </div>
  );
}