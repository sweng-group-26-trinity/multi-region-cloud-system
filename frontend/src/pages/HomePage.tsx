import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Represents a team member displayed in the org chart.
 */
type Person = {
  /** Unique identifier used as a React key and for link mapping. */
  id: string;
  /** Full display name of the team member. */
  name: string;
  /** Job title or role within the team. */
  role: string;
  /** URL path to the member's avatar image. */
  img: string;
};

/**
 * Top-row team members — leads for each discipline.
 */
const topRow: Person[] = [
  {
    id: "xiaofan",
    name: "Xiaofan Bu",
    role: "Frontend Lead",
    img: "/public/team/xiaofan.jpg",
  },
  {
    id: "ayush",
    name: "Ayush",
    role: "Backend Lead",
    img: "/public/team/ayush.jpg",
  },
  {
    id: "luke",
    name: "Luke Bailey",
    role: "DevOps Lead",
    img: "/public/team/luke.jpg",
  },
];

/**
 * Bottom-row team members — engineers reporting to the leads.
 */
const bottomRow: Person[] = [
  {
    id: "daniel",
    name: "Daniel Schwer",
    role: "Frontend Engineer",
    img: "/public/team/daniel.jpg",
  },
  {
    id: "noah",
    name: "Noah Scolard",
    role: "Frontend Engineer",
    img: "/public/team/noah.jpg",
  },
  {
    id: "erin",
    name: "Erin Ryan",
    role: "Frontend Engineer",
    img: "/public/team/erin.jpg",
  },
  {
    id: "dev",
    name: "Dev Joshi",
    role: "Cloud & DevOps Engineer",
    img: "/public/team/dev.jpg",
  },
  {
    id: "darragh",
    name: "Darragh",
    role: "Backend Engineer",
    img: "/public/team/darragh.jpg",
  },
];

/**
 * Directed edges that define reporting lines between leads and engineers.
 * Each entry connects a top-row member (`from`) to a bottom-row member (`to`).
 */
const links: Array<{ from: string; to: string }> = [
  { from: "xiaofan", to: "daniel" },
  { from: "xiaofan", to: "noah" },
  { from: "ayush", to: "erin" },
  { from: "luke", to: "dev" },
  { from: "luke", to: "darragh" },
];

/**
 * Renders a circular avatar with an orange border, name, and role label.
 *
 * @param props.person - The {@link Person} whose details are displayed.
 */
function AvatarNode({ person }: { person: Person }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative h-28 w-28">
        <div className="absolute inset-0 rounded-full border-[5px] border-orange-500 shadow-md" />
        <div className="absolute inset-[5px] overflow-hidden rounded-full bg-white">
          <img
            src={person.img}
            alt={person.name}
            className="h-full w-full rounded-full object-cover"
            loading="lazy"
            draggable={false}
          />
        </div>
      </div>

      {/* 
        Team member text uses dark-mode-aware colours so names and roles
        remain readable against the darker card background.
      */}
      <div className="mt-4 text-lg font-extrabold text-black">
        {person.name}
      </div>
      <div className="text-gray-700">{person.role}</div>
    </div>
  );
}

/**
 * Home page for the DineHub application.
 *
 * Displays the project title, collaboration credit, navigation buttons,
 * and an org-chart visualising the team structure with SVG connector lines.
 *
 * @returns The full-page home view.
 */
export default function HomePage() {
  /**
   * Fractional horizontal positions (0–1) for each top-row member.
   * Multiplied by 100 to produce SVG `viewBox` coordinates.
   */
  const topX: Record<"xiaofan" | "ayush" | "luke", number> = {
    xiaofan: 1 / 6,
    ayush: 1 / 2,
    luke: 5 / 6,
  };

  /**
   * Fractional horizontal positions (0–1) for each bottom-row member.
   * Multiplied by 100 to produce SVG `viewBox` coordinates.
   */
  const bottomX: Record<
    "daniel" | "noah" | "erin" | "dev" | "darragh",
    number
  > = {
    daniel: 1 / 10,
    noah: 3 / 10,
    erin: 5 / 10,
    dev: 7 / 10,
    darragh: 9 / 10,
  };

  /** Vertical SVG coordinate for the top row of avatars. */
  const topY = 30;
  /** Vertical SVG coordinate for the bottom row of avatars. */
  const bottomY = 78;

  return (
    <div className="min-h-screen w-full bg-transparent">
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-14">
        {/* 
          Main homepage card.

          Dark-mode support is added here so the card, headings, and content
          remain high-contrast when the application theme switches to dark mode.
        */}
        <Card className="rounded-2xl bg-white/95 shadow-xl backdrop-blur dark:bg-slate-900/95 dark:shadow-black/30">
          <CardHeader className="space-y-3 text-center">
            <CardTitle className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Group 26
            </CardTitle>

            <p className="text-lg text-gray-600 dark:text-slate-300">
              Resilient Multi-Region Cloud-Native Restaurant Ordering System
            </p>

            <p className="font-semibold text-orange-500">
              In collaboration with Toast
            </p>

            <div className="flex flex-wrap justify-center gap-3 pt-3">
              <Button asChild className="rounded-xl px-6">
                <Link to="/dashboard">Go to Orders</Link>
              </Button>

              {/* 
                Outline buttons are given dark-mode-aware background, border,
                and text colours to avoid disappearing on dark pages.
              */}
              <Button
                asChild
                variant="outline"
                className="rounded-xl bg-white px-6 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <Link to="/login">Login</Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="rounded-xl bg-white px-6 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <Link to="/health">Health</Link>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pb-12">
            <h2 className="mt-6 mb-10 text-center text-4xl font-extrabold text-slate-900 dark:text-white">
              Team &amp; Roles
            </h2>

            <div className="relative overflow-hidden rounded-2xl bg-[#f6d2cb] p-10">
              {/* SVG connector lines linking leads to their direct reports */}
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {/* Horizontal spine connecting all top-row leads */}
                <line
                  x1={topX.xiaofan * 100}
                  y1={topY}
                  x2={topX.luke * 100}
                  y2={topY}
                  stroke="#ef6b3a"
                  strokeWidth="0.4"
                />

                {/* Elbow connectors from each lead down to their reports */}
                {links.map((l) => {
                  const x1 = topX[l.from as keyof typeof topX] * 100;
                  const x2 = bottomX[l.to as keyof typeof bottomX] * 100;
                  const midY = (topY + bottomY) / 2;

                  return (
                    <g key={`${l.from}-${l.to}`}>
                      <line
                        x1={x1}
                        y1={topY}
                        x2={x1}
                        y2={midY}
                        stroke="#ef6b3a"
                        strokeWidth="0.4"
                      />
                      <line
                        x1={x1}
                        y1={midY}
                        x2={x2}
                        y2={midY}
                        stroke="#ef6b3a"
                        strokeWidth="0.4"
                      />
                      <line
                        x1={x2}
                        y1={midY}
                        x2={x2}
                        y2={bottomY}
                        stroke="#ef6b3a"
                        strokeWidth="0.4"
                      />
                    </g>
                  );
                })}
              </svg>

              <div className="relative z-10">
                {/* Top row — leads */}
                <div className="grid grid-cols-3 items-start gap-10">
                  {topRow.map((p) => (
                    <AvatarNode key={p.id} person={p} />
                  ))}
                </div>

                {/* Bottom row — engineers */}
                <div className="mt-14 grid grid-cols-5 items-start gap-8">
                  {bottomRow.map((p) => (
                    <AvatarNode key={p.id} person={p} />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
