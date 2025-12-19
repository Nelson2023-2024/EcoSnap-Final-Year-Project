"use client";

import { 
  Camera, 
  MapPin, 
  Truck, 
  Gift, 
  ArrowRight, 
  Leaf, 
  Recycle,
  Cpu,
  TreeDeciduous,
  Sparkles,
  CheckCircle2,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Linkedin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const steps = [
  {
    number: "01",
    icon: Camera,
    title: "Capture the Waste",
    description: "Simply snap a photo of any waste pile you encounter. Our app works with any camera quality and lighting condition.",
    features: ["Any waste type", "Quick photo capture", "Works offline"],
    color: "primary"
  },
  {
    number: "02", 
    icon: Cpu,
    title: "AI Analysis",
    description: "Our Gemini-powered AI identifies specific materials — PET plastics, e-waste, textiles, glass, and more — assessing environmental impact.",
    features: ["Material identification", "Impact assessment", "Source detection"],
    color: "accent"
  },
  {
    number: "03",
    icon: MapPin,
    title: "Location Tracking",
    description: "GPS automatically captures your location. Report on behalf of another site by entering the address manually.",
    features: ["Auto GPS capture", "Manual entry option", "Hotspot flagging"],
    color: "primary"
  },
  {
    number: "04",
    icon: Truck,
    title: "Smart Dispatch",
    description: "The right team is dispatched — recyclables unit, e-waste specialists, or general cleanup — arriving within 24-48 hours.",
    features: ["Specialized teams", "24-48hr response", "Live tracking"],
    color: "accent"
  },
  {
    number: "05",
    icon: Gift,
    title: "Earn Rewards",
    description: "After successful collection, earn eco-points redeemable for tree seedlings, flowers, recycling bins, and more.",
    features: ["Points system", "Eco-friendly rewards", "Track contributions"],
    color: "primary"
  },
  {
    number: "06",
    icon: TreeDeciduous,
    title: "Plant & Grow",
    description: "Use your points to purchase items that support reforestation and sustainable agriculture — all within the app.",
    features: ["Tree seedlings", "Banana roots", "Recycling bins"],
    color: "accent"
  }
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/30 to-background" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          
          {/* Floating Icons */}
          <div className="absolute top-32 left-[15%] animate-bounce hidden lg:block">
            <div className="p-4 glass rounded-2xl backdrop-blur-sm bg-card/50 border">
              <Leaf className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div className="absolute top-48 right-[20%] animate-bounce hidden lg:block" style={{ animationDelay: "0.1s" }}>
            <div className="p-4 glass rounded-2xl backdrop-blur-sm bg-card/50 border">
              <Recycle className="w-8 h-8 text-accent" />
            </div>
          </div>
          <div className="absolute bottom-40 left-[25%] animate-bounce hidden lg:block" style={{ animationDelay: "0.2s" }}>
            <div className="p-4 glass rounded-2xl backdrop-blur-sm bg-card/50 border">
              <Camera className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="container relative z-10 px-4 py-20 md:py-32">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 backdrop-blur-sm bg-card/50 border rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                <span className="text-muted-foreground">AI-Powered Waste Management</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
                Snap. Report.{" "}
                <span className="bg-gradient-to-r from-eco-primary to-eco-success bg-clip-text text-transparent">
                  Save the Planet.
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Transform waste into action. Our AI identifies materials, tracks environmental impact, 
                and dispatches the right cleanup crew — all from a single photo.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <Link href="/signup">
                  <Button className="bg-eco-primary hover:bg-eco-primary/90 text-white text-lg px-8 py-6 rounded-full group">
                    Start Reporting
                    <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button variant="outline" className="rounded-full px-8 py-6 text-lg border-2 hover:bg-secondary">
                    Learn More
                  </Button>
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 max-w-3xl mx-auto">
                {[
                  { value: "50K+", label: "Reports Filed" },
                  { value: "24hr", label: "Avg Response" },
                  { value: "98%", label: "Accuracy Rate" },
                  { value: "10K+", label: "Trees Planted" },
                ].map((stat, index) => (
                  <div key={index} className="text-center space-y-1">
                    <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-eco-primary to-eco-success bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Visual */}
            <div className="mt-16 max-w-5xl mx-auto">
              <div className="relative">
                <div className="backdrop-blur-sm bg-card/50 border rounded-3xl p-6 md:p-8">
                  <div className="grid md:grid-cols-4 gap-4">
                    {[
                      { icon: Camera, title: "Capture", desc: "Take a photo of waste" },
                      { icon: MapPin, title: "Locate", desc: "GPS auto-detection" },
                      { icon: Truck, title: "Dispatch", desc: "Team assigned 24-48h" },
                      { icon: Gift, title: "Earn", desc: "Get eco-points & rewards" },
                    ].map((step, index) => (
                      <div
                        key={index}
                        className="flex flex-col items-center text-center p-4 rounded-2xl hover:bg-secondary/50 transition-colors"
                      >
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-eco-primary to-eco-success flex items-center justify-center mb-3">
                          <step.icon className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="font-semibold">{step.title}</h3>
                        <p className="text-sm text-muted-foreground">{step.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 md:py-32 relative overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
          <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2" />
          <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl" />

          <div className="container relative z-10 px-4">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
              <div className="inline-flex items-center gap-2 px-4 py-2 backdrop-blur-sm bg-card/50 border rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-muted-foreground">Simple Process</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
                How It <span className="bg-gradient-to-r from-eco-primary to-eco-success bg-clip-text text-transparent">Works</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                From spotting waste to planting trees — here's how you make a difference in just a few taps.
              </p>
            </div>

            {/* Steps Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="group relative"
                >
                  <div className="backdrop-blur-sm bg-card/50 border rounded-3xl p-6 md:p-8 h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    {/* Step Number */}
                    <div className="absolute -top-3 -right-3 w-12 h-12 bg-gradient-to-br from-eco-primary to-eco-success rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-lg">
                      {step.number}
                    </div>

                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
                      step.color === 'primary' 
                        ? 'bg-primary/10' 
                        : 'bg-accent/10'
                    }`}>
                      <step.icon className={`w-8 h-8 ${
                        step.color === 'primary' 
                          ? 'text-primary' 
                          : 'text-accent'
                      }`} />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      {step.description}
                    </p>

                    {/* Features */}
                    <div className="space-y-2">
                      {step.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="text-center mt-16 md:mt-24">
              <div className="inline-flex flex-col sm:flex-row items-center gap-4 backdrop-blur-sm bg-card/50 border rounded-full p-3">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-eco-primary to-eco-success border-2 border-background flex items-center justify-center text-white text-xs font-bold"
                    >
                      {i === 4 ? '5K+' : ''}
                    </div>
                  ))}
                </div>
                <p className="text-muted-foreground px-4">
                  Join <span className="font-semibold text-foreground">5,000+</span> eco-warriors making a difference
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-eco-primary/10 via-accent/10 to-eco-primary/10" />
          
          <div className="container relative z-10 px-4">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                Ready to Make a <span className="bg-gradient-to-r from-eco-primary to-eco-success bg-clip-text text-transparent">Difference?</span>
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                Join thousands of users making our planet cleaner, one report at a time.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <Link href="/signup">
                  <Button size="lg" className="bg-eco-primary hover:bg-eco-primary/90 text-white text-lg px-8 py-6 rounded-full">
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-full border-2">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-secondary/30 border-t border-border">
        <div className="container px-4 py-12 md:py-16">
          <div className="grid md:grid-cols-4 gap-8 md:gap-12">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-eco-primary flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">
                  Eco<span className="text-eco-primary">Snap</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered waste management platform making the world cleaner, one snap at a time.
              </p>
              <div className="flex gap-3">
                <a href="#" className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="#" className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="#" className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="#" className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors">
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h3 className="font-semibold mb-4">Stay Updated</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get the latest news and updates delivered to your inbox.
              </p>
              <div className="flex gap-2">
                <Input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="flex-1"
                />
                <Button size="icon" className="bg-eco-primary hover:bg-eco-primary/90 flex-shrink-0">
                  <Mail className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} EcoSnap. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;