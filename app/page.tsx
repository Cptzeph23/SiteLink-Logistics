import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Package, MapPin, CheckCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Truck className="h-8 w-8 text-construction-orange" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">SiteLink Logistics</h1>
              <p className="text-sm text-slate-600">Linking materials to sites</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-construction-orange hover:bg-construction-orange/90">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-5xl font-bold text-slate-900 mb-4">
          Professional Construction Logistics
        </h2>
        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
          Transport cement, steel, timber, and building materials with reliable 1.5-2 tonne vehicles. 
          Real-time tracking, transparent pricing, and proof of delivery.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register?role=client">
            <Button size="lg" className="bg-construction-orange hover:bg-construction-orange/90">
              Book a Transport
            </Button>
          </Link>
          <Link href="/register?role=driver">
            <Button size="lg" variant="outline">
              Become a Driver
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">Why Choose SiteLink?</h3>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Package className="h-12 w-12 text-construction-orange mb-4" />
              <CardTitle>Weight-Aware System</CardTitle>
              <CardDescription>
                Automatic weight calculation prevents vehicle overloading and ensures safe transport
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <MapPin className="h-12 w-12 text-construction-orange mb-4" />
              <CardTitle>Real-Time Tracking</CardTitle>
              <CardDescription>
                Track your materials from pickup to delivery with live GPS updates
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CheckCircle className="h-12 w-12 text-construction-orange mb-4" />
              <CardTitle>Transparent Pricing</CardTitle>
              <CardDescription>
                Know exactly what you're paying for with detailed price breakdowns
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16 bg-white rounded-lg my-8">
        <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-construction-orange text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              1
            </div>
            <h4 className="font-semibold mb-2">Select Materials</h4>
            <p className="text-sm text-slate-600">Choose from our catalog of construction materials</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-construction-orange text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              2
            </div>
            <h4 className="font-semibold mb-2">Get Instant Quote</h4>
            <p className="text-sm text-slate-600">See transparent pricing based on distance and weight</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-construction-orange text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              3
            </div>
            <h4 className="font-semibold mb-2">Track Delivery</h4>
            <p className="text-sm text-slate-600">Monitor your materials in real-time with GPS</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-construction-orange text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              4
            </div>
            <h4 className="font-semibold mb-2">Confirm & Pay</h4>
            <p className="text-sm text-slate-600">Digital proof of delivery and easy M-Pesa payment</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Card className="bg-construction-orange text-white border-0">
          <CardHeader>
            <CardTitle className="text-3xl text-white">Ready to streamline your logistics?</CardTitle>
            <CardDescription className="text-white/90 text-lg">
              Join hundreds of builders and contractors using SiteLink
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/register">
              <Button size="lg" variant="secondary" className="bg-white text-construction-orange hover:bg-slate-100">
                Get Started Today
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-slate-600">
          <p>&copy; 2024 SiteLink Logistics. All rights reserved.</p>
          <p className="text-sm mt-2">Professional construction logistics in Kenya</p>
        </div>
      </footer>
    </div>
  );
}