import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  verified: boolean;
}

const testimonials: Testimonial[] = [
  {
    id: "1",
    quote: "Within 8 weeks I noticed significantly less shedding. My hair feels thicker and stronger than ever before.",
    author: "Sarah M., age 42",
    verified: true,
  },
  {
    id: "2",
    quote: "After trying everything without results, the personalized approach finally worked. Visible growth in 3 months!",
    author: "James K., age 51",
    verified: true,
  },
  {
    id: "3",
    quote: "The assessment revealed gaps I didn't know about. My nutrition plan alone changed everything.",
    author: "Michelle L., age 38",
    verified: true,
  },
  {
    id: "4",
    quote: "Love that it's personalized to my hair type and stress levels. No more generic supplements that didn't work.",
    author: "David R., age 45",
    verified: true,
  },
  {
    id: "5",
    quote: "Best investment for my hair health. Results exceeded expectations within the first 2 months.",
    author: "Amanda P., age 39",
    verified: true,
  },
];

export const TestimonialCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate testimonials every 5 seconds
  const autoRotate = () => {
    if (testimonials.length > 1) {
      setCurrentIndex((prev) =>
        prev < testimonials.length - 2 ? prev + 2 : 0
      );
    }
  };

  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Start auto-rotation on mount, stop on unmount
  React.useEffect(() => {
    intervalRef.current = setInterval(autoRotate, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const nextTestimonial = () => {
    setCurrentIndex((prev) =>
      prev < testimonials.length - 2 ? prev + 2 : 0
    );
  };

  return (
    <section className="w-full py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h3 className="text-lg font-semibold text-primary mb-2">
            See what others say about their hair regrowth journey
          </h3>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Join 2,000+ users who've taken their hair health back into their own hands. These results may vary based on individual factors.
          </p>
        </div>

        {/* Testimonial Card */}
        <div className="max-w-4xl mx-auto">
          <Card className="border-primary/20 bg-gradient-to-br from-background to-accent/5">
            <CardContent className="py-10 md:py-12">
              {/* Quote with verification badge */}
              <div className="flex items-start gap-4 mb-6">
                <span className="text-6xl text-primary/10 font-serif">"</span>
                <div className="flex-1">
                  <p className="text-lg md:text-xl leading-relaxed text-foreground">
                    {testimonials[currentIndex].quote}
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="font-medium text-primary">
                      {testimonials[currentIndex].author}
                    </span>
                    {testimonials[currentIndex].verified && (
                      <>
                        <Check className="h-4 w-4 text-green-500" />
                        <Badge variant="secondary" className="text-xs bg-green-500/10">
                          Verified User
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation controls */}
              <div className="flex items-center justify-between">
                <Badge 
                  variant="outline" 
                  className="text-xs cursor-pointer hover:text-primary hover:border-primary transition-colors"
                  onClick={nextTestimonial}
                >
                  Previous testimonial
                </Badge>

                <div className="flex gap-1">
                  {/* Dots to show progress */}
                  {Array.from({ length: testimonials.length / 2 }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i * 2)}
                      className={`h-2 w-8 rounded-full transition-all ${
                        Math.floor(currentIndex / 2) === i
                          ? "bg-primary"
                          : "bg-muted hover:bg-muted/70"
                      }`}
                    />
                  ))}
                </div>

                <Badge 
                  variant="outline" 
                  className="text-xs cursor-pointer hover:text-primary hover:border-primary transition-colors"
                  onClick={nextTestimonial}
                >
                  Next testimonial
                </Badge>
              </div>

              {/* Progress indicator */}
              <p className="mt-4 text-center text-xs text-muted-foreground">
                {currentIndex === 0 && testimonials[currentIndex]?.quote.startsWith("Within") && (
                  <>Results timeline may vary based on individual factors</>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Social proof stats */}
        <div className="mt-8 grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
          <div className="text-center p-4 rounded-lg border bg-background/50">
            <div className="text-3xl font-bold text-primary mb-1">2,000+</div>
            <div className="text-sm text-muted-foreground">Happy users</div>
          </div>
          <div className="text-center p-4 rounded-lg border bg-background/50">
            <div className="text-3xl font-bold text-primary mb-1">4.9/5</div>
            <div className="text-sm text-muted-foreground">Average rating</div>
          </div>
          <div className="text-center p-4 rounded-lg border bg-background/50">
            <div className="text-3xl font-bold text-primary mb-1">92%</div>
            <div className="text-sm text-muted-foreground">See results in 8 weeks</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const TrustBadge: React.FC = () => {
  return (
    <div className="flex items-center gap-4 justify-center">
      <div className="text-center">
        <p className="text-lg font-bold text-primary">2,000+</p>
        <p className="text-xs text-muted-foreground">Happy users</p>
      </div>
      
      <div className="h-px w-8 bg-border" />
      
      <div className="text-center">
        <p className="text-lg font-bold text-primary">4.9/5</p>
        <p className="text-xs text-muted-foreground">Average rating</p>
      </div>
      
      <div className="h-px w-8 bg-border" />
      
      <div className="text-center">
        <p className="text-lg font-bold text-primary">30-day</p>
        <p className="text-xs text-muted-foreground">Money-back guarantee</p>
      </div>
      
      <div className="h-px w-8 bg-border" />
      
      <div className="text-center">
        <p className="text-lg font-bold text-primary">2025</p>
        <p className="text-xs text-muted-foreground">Customer service hours</p>
      </div>
    </div>
  );
};

export default TestimonialCarousel;
