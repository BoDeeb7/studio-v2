
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2 } from "lucide-react";
import { generateMakeupDescription } from "@/ai/flows/generate-makeup-description-flow";

interface AIGeneratorDialogProps {
  onGenerated: (name: string, description: string) => void;
}

export function AIGeneratorDialog({ onGenerated }: AIGeneratorDialogProps) {
  const [theme, setTheme] = useState("");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleGenerate = async () => {
    if (!theme) return;
    setLoading(true);
    try {
      const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k);
      const result = await generateMakeupDescription({ theme, keywords: keywordArray });
      onGenerated(result.name, result.description);
      setIsOpen(false);
    } catch (error) {
      console.error("AI Generation failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          AI Ideas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Style Inspiration</DialogTitle>
          <DialogDescription>
            Let AI craft a compelling name and description for your new makeup service.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="theme">Core Theme</Label>
            <Input
              id="theme"
              placeholder="e.g., Midnight Glamour, Sun-Kissed Dew"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="keywords">Keywords (comma separated)</Label>
            <Input
              id="keywords"
              placeholder="e.g., matte, bold, crimson lips"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            onClick={handleGenerate} 
            disabled={loading || !theme}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Designing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Concept
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
