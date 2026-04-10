import Link from 'next/link'
import { FileText, Shield, Clock, CheckCircle, Globe, ArrowRight, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 rounded-md flex items-center justify-center">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">ProLang</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#services" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Services</a>
              <a href="#process" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Process</a>
              <a href="#pricing" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Pricing</a>
              <Link href="/auth/login">
                <Button variant="outline" size="sm">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm" className="bg-slate-900 hover:bg-slate-700">Get Started</Button>
              </Link>
            </div>
            <div className="md:hidden flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="outline" size="sm">Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 sm:py-28 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-6 bg-slate-100 text-slate-700 hover:bg-slate-100">
              Trusted by businesses across Mongolia
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
              Professional Document
              <span className="text-slate-500"> Translation</span>
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed mb-10">
              Certified translation services for legal documents, contracts, and official records.
              Upload your document and track progress in real time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-slate-900 hover:bg-slate-700 w-full sm:w-auto">
                  Submit a Document
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <a href="#process">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  How It Works
                </Button>
              </a>
            </div>
          </div>
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '500+', label: 'Documents Translated' },
              { value: '98%', label: 'Accuracy Rate' },
              { value: '24h', label: 'Express Delivery' },
              { value: '10+', label: 'Language Pairs' },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-6 bg-white border border-slate-200 rounded-xl">
                <div className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">What We Translate</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Specializing in legal and official document translation with certified accuracy
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: FileText,
                title: 'Legal Documents',
                description: 'Contracts, agreements, court documents, and legal correspondence',
                items: ['Contracts', 'Court Orders', 'Legal Agreements', 'Affidavits'],
              },
              {
                icon: Shield,
                title: 'Official Records',
                description: 'Government-issued documents and identity records',
                items: ['Birth Certificates', 'Marriage Certificates', 'Passports', 'Academic Diplomas'],
              },
              {
                icon: CheckCircle,
                title: 'Business Documents',
                description: 'Corporate and commercial document translation',
                items: ['Company Registration', 'Financial Reports', 'Power of Attorney', 'Business Licenses'],
              },
            ].map((service) => (
              <div key={service.title} className="p-6 border border-slate-200 rounded-xl hover:border-slate-400 transition-colors">
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                  <service.icon className="w-6 h-6 text-slate-700" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{service.title}</h3>
                <p className="text-slate-600 text-sm mb-4">{service.description}</p>
                <ul className="space-y-1">
                  {service.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-slate-500">
                      <CheckCircle className="w-3 h-3 text-teal-600 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="process" className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-slate-600">Simple, transparent, professional</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Upload Document', description: 'Upload your PDF, image, or Word document securely' },
              { step: '02', title: 'We Review', description: 'Our team reviews and extracts the document text' },
              { step: '03', title: 'Expert Translation', description: 'Assigned to a qualified professional translator' },
              { step: '04', title: 'Download & Done', description: 'Receive your certified translated document' },
            ].map((step, idx) => (
              <div key={step.step} className="relative">
                {idx < 3 && (
                  <div className="hidden md:block absolute top-6 left-full w-full h-px bg-slate-200 z-0" />
                )}
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center text-sm font-bold mb-4">
                    {step.step}
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certification types */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Certification Options</h2>
            <p className="text-slate-600">Choose the level of certification you need</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Certified Translation',
                urgency: 'Standard',
                badge: '',
                description: 'Official certified translation suitable for government and legal use',
                features: [
                  'Certificate of Accuracy',
                  'Translator credentials',
                  'Standard turnaround',
                  'Digital delivery',
                ],
                cta: 'Standard',
              },
              {
                name: 'Notarized Translation',
                urgency: 'Express',
                badge: 'Popular',
                description: 'Certified translation with notary seal for official proceedings',
                features: [
                  'Everything in Certified',
                  'Notary seal',
                  'Express turnaround',
                  'Physical + digital delivery',
                ],
                cta: 'Popular',
              },
              {
                name: 'Apostille',
                urgency: 'Urgent',
                badge: '',
                description: 'International certification recognized by Hague Convention countries',
                features: [
                  'Everything in Notarized',
                  'Apostille stamp',
                  'International validity',
                  'Priority handling',
                ],
                cta: 'International',
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`p-6 rounded-xl border-2 ${plan.badge ? 'border-slate-900' : 'border-slate-200'} relative`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                )}
                <h3 className="text-lg font-bold text-slate-900 mb-1">{plan.name}</h3>
                <p className="text-slate-600 text-sm mb-4">{plan.description}</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-teal-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup">
                  <Button className={`w-full ${plan.badge ? 'bg-slate-900 hover:bg-slate-700' : ''}`} variant={plan.badge ? 'default' : 'outline'}>
                    Get Started
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Client Testimonials</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: 'ProLang handled our corporate documents with exceptional professionalism. The certified translations were accepted immediately.',
                author: 'Bat-Erdene G.',
                role: 'CEO, Mining Company',
              },
              {
                quote: 'Fast, accurate, and the status tracking portal is incredibly convenient. I always knew exactly where my documents were.',
                author: 'Solongo B.',
                role: 'Immigration Attorney',
              },
              {
                quote: 'The apostille service saved us weeks of back and forth. Highly recommended for international business documents.',
                author: 'Enkhjargal D.',
                role: 'Business Consultant',
              },
            ].map((t) => (
              <div key={t.author} className="bg-white p-6 rounded-xl border border-slate-200">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{t.author}</div>
                  <div className="text-slate-500 text-xs">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-slate-400 mb-8 text-lg">
            Upload your document today and get a professional certified translation
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
              Submit Your Document
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 rounded-md flex items-center justify-center">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900">ProLang</span>
              <span className="text-slate-400 text-sm">Translation Services</span>
            </div>
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} ProLang. All rights reserved. | prolang.mbg.mn
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
