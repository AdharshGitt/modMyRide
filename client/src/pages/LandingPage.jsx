import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCurrentUser } from "../services/api.js";
import heroImage from "../assets/hero_car.png";

const LandingPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { user: u } = await fetchCurrentUser();
        setUser(u);
      } catch {
        setUser(null);
      }
    };
    checkUser();
  }, []);

  const handleStartTuning = () => {
    if (user) {
      if (user.role === 'admin') {
        navigate("/admin");
      } else {
        navigate("/tuning");
      }
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-[#1d100e] text-[#f7ddd9] font-body-md overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-[#1d100e]/80 backdrop-blur-md border-b border-white/5 h-20 flex items-center justify-between px-8 md:px-16">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#C0392B] flex items-center justify-center rounded-sm rotate-45">
            <span className="material-symbols-outlined text-white -rotate-45 text-lg">speed</span>
          </div>
          <span className="font-['Oswald'] text-2xl font-black tracking-tighter uppercase text-white">ModMyRide</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => navigate("/")} className="font-['Oswald'] uppercase tracking-widest text-xs text-white hover:text-[#C0392B] transition-colors">Home</button>
          <button onClick={handleStartTuning} className="font-['Oswald'] uppercase tracking-widest text-xs text-zinc-400 hover:text-white transition-colors">Recommend</button>
          <button onClick={handleStartTuning} className="font-['Oswald'] uppercase tracking-widest text-xs text-zinc-400 hover:text-white transition-colors">Saved Profiles</button>
        </div>

        <button 
          onClick={handleStartTuning}
          className="bg-[#C0392B] hover:bg-[#a93226] text-white px-6 py-2.5 font-['Oswald'] uppercase tracking-widest text-xs transition-all shadow-[0_4px_20px_rgba(192,57,43,0.3)]"
        >
          {user ? 'Dashboard' : 'Get Started'}
        </button>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative h-screen flex items-center pt-20">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Performance Car" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1d100e] via-[#1d100e]/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#1d100e] via-transparent to-transparent"></div>
        </div>

        <div className="relative z-10 px-8 md:px-16 max-w-4xl">
          <h2 className="text-[#C0392B] font-['Oswald'] uppercase tracking-[0.3em] text-sm md:text-base mb-4 animate-in fade-in slide-in-from-left duration-700">Engineering Excellence</h2>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-['Oswald'] font-black uppercase leading-[0.9] tracking-tighter text-white mb-6 animate-in fade-in slide-in-from-left duration-1000">
            Unlock Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#C0392B]">Vehicle's Potential</span>
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-xl mb-10 font-body-lg animate-in fade-in slide-in-from-left duration-1000 delay-300">
            Get personalized car & bike performance upgrade recommendations based on your goals and budget — built for Indian enthusiasts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom duration-1000 delay-500">
            <button 
              onClick={handleStartTuning}
              className="px-10 py-4 bg-[#C0392B] text-white font-['Oswald'] uppercase tracking-widest text-sm hover:scale-105 transition-transform"
            >
              {user ? 'Go to Tuning' : 'Start Tuning'}
            </button>
            <button className="px-10 py-4 border border-white/20 text-white font-['Oswald'] uppercase tracking-widest text-sm hover:bg-white/5 transition-colors">
              Explore Guide
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30 animate-bounce">
          <span className="font-['Oswald'] text-[10px] uppercase tracking-[0.3em] vertical-rl">Scroll</span>
          <div className="w-px h-12 bg-white"></div>
        </div>
      </section>

      {/* Steps Section */}
      <section id="recommend" className="py-32 px-8 md:px-16 bg-[#170b09]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-[#C0392B] font-['Oswald'] uppercase tracking-[0.2em] text-sm mb-4">Precision Workflow</h2>
              <h3 className="text-4xl md:text-5xl font-['Oswald'] font-bold uppercase text-white tracking-tight">How We Tune Your Experience</h3>
            </div>
            <p className="text-zinc-500 max-w-sm text-right font-body-sm">
              Our recommendation engine uses real-world data and mechanical expertise to build your perfect roadmap.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { num: "01", title: "Select Vehicle", desc: "Tell us what you drive. We support all major Indian manufacturers.", icon: "directions_car" },
              { num: "02", title: "Choose Goal", desc: "Performance, handling, off-road, or better mileage. You decide.", icon: "target" },
              { num: "03", title: "Set Budget", desc: "Define your spending limit in INR to get local parts pricing.", icon: "payments" },
              { num: "04", title: "Get Results", desc: "A curated performance roadmap with direct component links.", icon: "auto_graph" }
            ].map((step, i) => (
              <div key={i} className="group p-8 bg-[#2a1c1a] machined-edge hover:border-[#C0392B]/50 transition-all hover:-translate-y-2">
                <div className="flex justify-between items-start mb-12">
                  <span className="text-4xl font-['Oswald'] font-black text-white/5 group-hover:text-[#C0392B]/20 transition-colors">{step.num}</span>
                  <span className="material-symbols-outlined text-[#C0392B] text-3xl">{step.icon}</span>
                </div>
                <h4 className="text-xl font-['Oswald'] font-bold uppercase text-white mb-4 tracking-wider">{step.title}</h4>
                <p className="text-zinc-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-8 md:px-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#C0392B]/5"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-['Oswald'] font-bold uppercase text-white mb-8 tracking-tight">
            Ready to Build Your <span className="text-[#C0392B]">Ultimate Machine?</span>
          </h2>
          <button 
            onClick={handleStartTuning}
            className="px-12 py-5 bg-[#C0392B] text-white font-['Oswald'] uppercase tracking-[0.2em] text-sm hover:scale-105 transition-all shadow-[0_10px_40px_rgba(192,57,43,0.4)]"
          >
            {user ? 'Open My Profile' : 'Create Your Profile'}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#170b09] border-t border-white/5 py-16 px-8 md:px-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 lg:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 bg-[#C0392B] flex items-center justify-center rounded-sm rotate-45">
                <span className="material-symbols-outlined text-white -rotate-45 text-xs">speed</span>
              </div>
              <span className="font-['Oswald'] text-xl font-black tracking-tighter uppercase text-white">ModMyRide</span>
            </div>
            <p className="text-zinc-500 text-sm mb-6">
              The definitive tuning platform for the modern Indian motorist. Precision engineered for performance enthusiasts.
            </p>
          </div>

          <div>
            <h4 className="font-['Oswald'] uppercase tracking-widest text-xs text-white mb-6">Explore</h4>
            <ul className="space-y-4">
              <li><button onClick={() => navigate("/")} className="text-zinc-500 hover:text-[#C0392B] text-sm transition-colors text-left">About Us</button></li>
              <li><button onClick={handleStartTuning} className="text-zinc-500 hover:text-[#C0392B] text-sm transition-colors text-left">Performance Guide</button></li>
              <li><button onClick={handleStartTuning} className="text-zinc-500 hover:text-[#C0392B] text-sm transition-colors text-left">Recommendations</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-['Oswald'] uppercase tracking-widest text-xs text-white mb-6">Legal</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-zinc-500 hover:text-[#C0392B] text-sm transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-zinc-500 hover:text-[#C0392B] text-sm transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-zinc-500 hover:text-[#C0392B] text-sm transition-colors">Cookie Policy</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-['Oswald'] uppercase tracking-widest text-xs text-white mb-6">Connect</h4>
            <div className="flex gap-4">
              {['facebook', 'instagram', 'twitter', 'youtube'].map((social) => (
                <a key={social} href="#" className="w-10 h-10 bg-[#2a1c1a] machined-edge flex items-center justify-center text-zinc-500 hover:text-[#C0392B] hover:border-[#C0392B]/50 transition-all">
                  <span className="material-symbols-outlined text-lg">{social}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="pt-8 border-t border-white/5 text-center">
          <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-['Oswald']">
            © 2024 MODMYRIDE. Engineered for the Indian Market.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
