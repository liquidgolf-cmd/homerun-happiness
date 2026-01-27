import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-loam-neutral">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Returning users: Login */}
        <div className="flex justify-end mb-6 sm:mb-8">
          <Link
            to="/login"
            className="text-loam-brown font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-loam-brown focus:ring-offset-2 rounded px-3 py-2"
          >
            Already started? Log in
          </Link>
        </div>

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
        </div>

        {/* New users: Free pre-assessment */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              New here? Start for free
            </h2>
            <p className="text-gray-600 mb-6 text-center">
              Begin with our <strong className="text-loam-brown">pre-assessment</strong>—no sign-up or information required. You&apos;ll get a quick read on where you are and a recommended path. When you&apos;re done, we&apos;ll show your results and, if you&apos;d like your <strong>final summary</strong> sent to you, we&apos;ll ask for your name and email.
            </p>
            <div className="text-center mb-6">
              <Link
                to="/assessment"
                className="inline-block bg-loam-brown text-white px-8 py-4 rounded-loam text-lg font-semibold hover:bg-loam-brown/90 focus:outline-none focus:ring-2 focus:ring-loam-brown focus:ring-offset-2 transition shadow-lg hover:shadow-xl"
              >
                Take the free pre-assessment
              </Link>
            </div>
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 text-center">
                What you get when you go through the full process
              </h3>
              <ul className="space-y-2 text-gray-600 text-sm sm:text-base">
                <li className="flex items-start gap-2">
                  <span className="text-loam-green font-bold mt-0.5">✓</span>
                  <span>Direct AI coaching and honest feedback</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-loam-green font-bold mt-0.5">✓</span>
                  <span>The 5 Whys method to find your root motivation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-loam-green font-bold mt-0.5">✓</span>
                  <span>Vague-answer detection so you dig deeper</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-loam-green font-bold mt-0.5">✓</span>
                  <span>Progress through the bases with clear milestones</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Framework Explanation */}
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-loam-brown mb-8 sm:mb-12 text-center">
            The HomeRun Framework
          </h2>
          <div className="bg-loam-neutral rounded-loam p-4 sm:p-6 md:p-8 mb-12 border border-loam-clay/20">
            {/* Mobile: Vertical Stack | Desktop: Horizontal Flow */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 md:gap-4">
              {/* AT BAT - Brown Circle */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-loam-brown rounded-full flex flex-col items-center justify-center shadow-lg">
                <span className="text-white font-bold text-[10px] sm:text-xs md:text-sm text-center px-1 sm:px-2">AT BAT</span>
                <span className="text-white text-[9px] sm:text-xs opacity-90 mt-0.5 sm:mt-1">WHY</span>
              </div>
              
              {/* Arrow - Hidden on very small screens, shown on sm+ */}
              <div className="text-loam-clay text-xl sm:text-2xl md:text-3xl rotate-90 sm:rotate-0">›</div>
              
              {/* 1ST BASE - Green Rounded Rectangle */}
              <div className="bg-loam-green rounded-loam px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 shadow-lg min-w-[90px] sm:min-w-[100px] md:min-w-[120px] flex flex-col items-center">
                <span className="text-white font-bold text-xs sm:text-sm md:text-base">1ST BASE</span>
                <span className="text-white text-[10px] sm:text-xs opacity-90 mt-0.5 sm:mt-1">WHO</span>
              </div>
              
              {/* Arrow */}
              <div className="text-loam-clay text-xl sm:text-2xl md:text-3xl rotate-90 sm:rotate-0">›</div>
              
              {/* 2ND BASE - Green Rounded Rectangle */}
              <div className="bg-loam-green rounded-loam px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 shadow-lg min-w-[90px] sm:min-w-[100px] md:min-w-[120px] flex flex-col items-center">
                <span className="text-white font-bold text-xs sm:text-sm md:text-base">2ND BASE</span>
                <span className="text-white text-[10px] sm:text-xs opacity-90 mt-0.5 sm:mt-1">WHAT</span>
              </div>
              
              {/* Arrow */}
              <div className="text-loam-clay text-xl sm:text-2xl md:text-3xl rotate-90 sm:rotate-0">›</div>
              
              {/* 3RD BASE - Green Rounded Rectangle */}
              <div className="bg-loam-green rounded-loam px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 shadow-lg min-w-[90px] sm:min-w-[100px] md:min-w-[120px] flex flex-col items-center">
                <span className="text-white font-bold text-xs sm:text-sm md:text-base">3RD BASE</span>
                <span className="text-white text-[10px] sm:text-xs opacity-90 mt-0.5 sm:mt-1">HOW</span>
              </div>
              
              {/* Arrow */}
              <div className="text-loam-clay text-xl sm:text-2xl md:text-3xl rotate-90 sm:rotate-0 my-2 sm:my-0">›</div>
              
              {/* HOME - Green Diamond */}
              <div className="bg-loam-green w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 transform rotate-45 flex flex-col items-center justify-center shadow-lg mt-3 sm:mt-0 sm:ml-4 md:ml-6">
                <div className="transform -rotate-45 flex flex-col items-center justify-center w-full h-full">
                  <span className="text-white font-bold text-[10px] sm:text-xs md:text-sm text-center leading-tight block">HOME</span>
                  <span className="text-white text-[9px] sm:text-xs opacity-90 text-center mt-0.5 sm:mt-1 leading-tight block">MATTERS</span>
                </div>
              </div>
            </div>
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
            Take the free pre-assessment
          </Link>
        </div>
      </div>
    </div>
  );
}