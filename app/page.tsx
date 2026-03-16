"use client"
// have to comment so I can redeploy on vercel
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ShoppingBag,
  MessageSquare,
  RefreshCw,
  Search,
  ChevronDown,
  ArrowRight,
  Mail,
  Laptop,
  BookOpen,
  SofaIcon as Couch,
  ShoppingCart,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)

  const features = [
    {
      title: "Buy",
      description: "Browse thousands of items from students on your campus",
      icon: <ShoppingBag className="h-6 w-6" />,
    },
    {
      title: "Sell",
      description: "List your items in seconds and reach the entire campus",
      icon: <ShoppingCart className="h-6 w-6" />,
    },
    {
      title: "Trade",
      description: "Propose trades instead of cash transactions",
      icon: <RefreshCw className="h-6 w-6" />,
    },
    {
      title: "Message",
      description: "Chat directly with other students about listings",
      icon: <MessageSquare className="h-6 w-6" />,
    },
  ]

  const categories = [
    { name: "Textbooks", icon: <BookOpen className="h-5 w-5" /> },
    { name: "Technology", icon: <Laptop className="h-5 w-5" /> },
    { name: "Furniture", icon: <Couch className="h-5 w-5" /> },
    { name: "And more...", icon: <ChevronDown className="h-5 w-5" /> },
  ]

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)

    // Auto-rotate features
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length)
    }, 3000)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      clearInterval(interval)
    }
  }, [features.length])

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? "bg-white shadow-md py-2" : "bg-transparent py-4"
        }`}
      >
        <div className="container mx-auto flex items-center justify-between px-4">
          <div className="flex items-center">
            <Image src="/images/logo.png" alt="Campus Marketplace" width={120} height={40} className="h-10 w-auto" />
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-black hover:text-gray-600 transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-black hover:text-gray-600 transition-colors">
              How It Works
            </Link>
            <Link href="#testimonials" className="text-black hover:text-gray-600 transition-colors">
              Testimonials
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="outline" className="hidden sm:inline-flex">
                Log In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-black text-white hover:bg-gray-800">Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <motion.div
              className="md:w-1/2 mb-10 md:mb-0 md:pr-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">Your Campus Marketplace</h1>
              <p className="text-xl md:text-2xl text-gray-700 mb-8">
                Buy, sell, and trade with students on your campus. Exclusive to your university community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup">
                  <Button className="bg-black text-white hover:bg-gray-800 text-lg py-6 px-8">
                    Get Started with .edu Email
                  </Button>
                </Link>
              </div>
            </motion.div>
            <motion.div
              className="md:w-1/2 relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="relative rounded-lg overflow-hidden shadow-2xl border border-gray-200">
                <Image
                  src="/images/marketplace-screenshot.png"
                  alt="Campus Marketplace Interface"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              <motion.div
                className="absolute -bottom-5 -left-5 bg-white p-4 rounded-lg shadow-lg border border-gray-200"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-black" />
                  <span className="font-medium">Exclusive to your campus</span>
                </div>
              </motion.div>
              <motion.div
                className="absolute -top-5 -right-5 bg-white p-4 rounded-lg shadow-lg border border-gray-200"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-black" />
                  <span className="font-medium">Sign up with .edu email</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need in One Place</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Campus Marketplace makes it easy to buy, sell, and trade items with fellow students.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className={`bg-white p-6 rounded-xl shadow-md border-2 transition-all duration-300 ${
                  activeFeature === index ? "border-black scale-105" : "border-transparent"
                }`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How Campus Marketplace Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Getting started is easy. Join your campus community in just a few steps.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">1. Sign Up with .edu Email</h3>
              <p className="text-gray-600">
                Create an account using your school email to join your campus marketplace.
              </p>
            </motion.div>

            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">2. Browse or List Items</h3>
              <p className="text-gray-600">Search for what you need or list your items for sale in seconds.</p>
            </motion.div>

            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">3. Connect and Exchange</h3>
              <p className="text-gray-600">Message other students and arrange to meet on campus for exchanges.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Find Everything You Need</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Browse through various categories tailored for campus life.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category, index) => (
              <motion.div
                key={index}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.03 }}
              >
                <div className="bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center">
                  {category.icon}
                </div>
                <span className="font-medium">{category.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <motion.div
              className="md:w-1/2 mb-10 md:mb-0 md:pr-10"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Experience the Marketplace</h2>
              <p className="text-xl text-gray-600 mb-6">
                A simple, intuitive interface designed specifically for campus commerce. Browse listings, filter by
                category, and find exactly what you need.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-black rounded-full p-1">
                    <ArrowRight className="h-4 w-4 text-white" />
                  </div>
                  <span>Easy-to-use search and filters</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-black rounded-full p-1">
                    <ArrowRight className="h-4 w-4 text-white" />
                  </div>
                  <span>Category-based browsing</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-black rounded-full p-1">
                    <ArrowRight className="h-4 w-4 text-white" />
                  </div>
                  <span>One-click listing creation</span>
                </div>
              </div>
            </motion.div>
            <motion.div
              className="md:w-1/2"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Image src="/images/logo.png" alt="CM" width={40} height={20} className="h-8 w-auto" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-200"></div>
                    <div className="w-6 h-6 rounded-full bg-gray-200"></div>
                  </div>
                </div>
                <div className="relative mb-4">
                  <Input placeholder="Search your marketplace" className="pl-10 py-5 bg-gray-50" />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="bg-gray-200 w-full h-32 rounded-md mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="bg-gray-200 w-full h-32 rounded-md mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                    <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                    <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                  </div>
                  <Button className="bg-black text-white hover:bg-gray-800">Create Listing</Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Students Are Saying</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of students already using Campus Marketplace.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "I sold all my textbooks in one day. So much easier than the university bookstore!",
                name: "Alex J.",
                school: "Stanford University",
              },
              {
                quote: "Found a great deal on a mini fridge for my dorm. Saved at least 50% compared to retail.",
                name: "Taylor M.",
                school: "NYU",
              },
              {
                quote: "I traded my old calculator for a desk lamp I needed. Love that I can propose trades!",
                name: "Jordan L.",
                school: "University of Michigan",
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-white p-6 rounded-xl shadow-md"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-black">
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-bold">{testimonial.name}</p>
                  <p className="text-gray-500 text-sm">{testimonial.school}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="bg-black text-white rounded-2xl p-8 md:p-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Join Your Campus Marketplace?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Sign up with your .edu email and start buying, selling, and trading with your classmates today.
            </p>
            <div className="flex justify-center">
              <Link href="/signup">
                <Button className="bg-white text-black hover:bg-gray-100 py-6 px-8">Get Started</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center">
            <div className="mb-4 text-center">
              <Image src="/images/logo.png" alt="Campus Marketplace" width={120} height={40} className="h-10 w-auto" />
              <p className="text-gray-500 mt-2">The marketplace exclusively for students.</p>
            </div>
            <div className="border-t border-gray-200 w-full pt-8 text-center">
              <p className="text-gray-500 text-sm">
                © {new Date().getFullYear()} Campus Marketplace. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
