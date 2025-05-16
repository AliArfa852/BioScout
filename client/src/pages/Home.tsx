import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlantsIcon, MapPinIcon, SearchIcon, MessageSquareIcon, UserIcon } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-10">
      {/* Hero section */}
      <section className="py-10 md:py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Discover Islamabad's Biodiversity</h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8">
          Join our community to identify, track, and learn about local plants and animals in the Islamabad region
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/register">Join BioScout</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/map">Explore Map</Link>
          </Button>
        </div>
      </section>

      {/* Features section */}
      <section className="py-10">
        <h2 className="text-3xl font-bold text-center mb-8">How BioScout Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                <SearchIcon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Identify</CardTitle>
              <CardDescription>
                Upload photos of plants and animals you find in Islamabad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Our image recognition system powered by AI will help identify the species in your photos. No need for expert knowledge!</p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" asChild>
                <Link href="/identify">Try It Out</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                <MapPinIcon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Track</CardTitle>
              <CardDescription>
                Add your observations to our community database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Each observation contributes to our understanding of local biodiversity. View observations on an interactive map and earn points for your contributions.</p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" asChild>
                <Link href="/map">View Map</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                <MessageSquareIcon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Learn</CardTitle>
              <CardDescription>
                Ask questions about local biodiversity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Our AI-powered system can answer your questions about local plants and animals, drawing information from both our database and reference materials.</p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" asChild>
                <Link href="/ask">Ask BioScout</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* About section */}
      <section className="py-10 bg-secondary/20 rounded-lg p-6">
        <h2 className="text-3xl font-bold mb-6">About BioScout Islamabad</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <p>
              BioScout Islamabad is a community-driven biodiversity database focused on the unique ecosystems of Islamabad and surrounding areas, including the scenic Margalla Hills National Park.
            </p>
            <p>
              Our mission is to engage citizens in monitoring and conserving local biodiversity through technology and community collaboration.
            </p>
            <p>
              By tracking observations and identifying trends in our local environment, we contribute to conservation efforts and raise awareness about the rich biodiversity of our region.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Key Biodiversity Areas</h3>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Margalla Hills National Park</strong> - Home to diverse wildlife including various bird species, monkeys, and occasionally leopards</li>
              <li><strong>Rawal Lake</strong> - An important water reservoir with surrounding vegetation that supports diverse aquatic and terrestrial species</li>
              <li><strong>Shakarparian</strong> - A green space with native plants and various bird species</li>
              <li><strong>Islamabad's Urban Parks</strong> - Green spaces throughout the city that provide habitats for urban wildlife</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="py-10 text-center">
        <h2 className="text-3xl font-bold mb-4">Join Our Community Today</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
          Start identifying plants and animals in your area, contribute to our biodiversity database, and earn rewards for your discoveries.
        </p>
        <Button size="lg" asChild>
          <Link href="/register">Get Started</Link>
        </Button>
      </section>
    </div>
  );
}