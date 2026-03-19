import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// 图片从 src/assets/team 引入
import ayushImg from "@/assets/team/ayush.jpg";
import danielImg from "@/assets/team/daniel.jpg";
import darraghImg from "@/assets/team/darragh.jpg";
import devImg from "@/assets/team/dev.jpg";
import erinImg from "@/assets/team/erin.jpg";
import lukeImg from "@/assets/team/luke.jpg";
import noahImg from "@/assets/team/noah.jpg";
import xiaofanImg from "@/assets/team/xiaofan.jpg";

type Person = {
  id: string;
  name: string;
  role: string;
  img: string;
};

const topRow: Person[] = [
  { id: "xiaofan", name: "Xiaofan Bu", role: "Frontend Lead", img: xiaofanImg },
  { id: "ayush", name: "Ayush", role: "Backend Lead", img: ayushImg },
  { id: "luke", name: "Luke Bailey", role: "DevOps Lead", img: lukeImg },
];

const bottomRow: Person[] = [
  { id: "daniel", name: "Daniel Schwer", role: "Frontend Engineer", img: danielImg },
  { id: "noah", name: "Noah Scolard", role: "Frontend Engineer", img: noahImg },
  { id: "erin", name: "Erin Ryan", role: "Frontend Engineer", img: erinImg },
  { id: "dev", name: "Dev Joshi", role: "Cloud & DevOps Engineer", img: devImg },
  { id: "darragh", name: "Darragh", role: "Backend Engineer", img: darraghImg },
];

// 连接关系
const links: Array<{ from: string; to: string }> = [
  { from: "xiaofan", to: "daniel" },
  { from: "xiaofan", to: "noah" },
  { from: "ayush", to: "erin" },
  { from: "luke", to: "dev" },
  { from: "luke", to: "darragh" },
];

function AvatarNode({ person }: { person: Person }) {
  return (
    <div className="flex flex-col items-center text-center transition-all duration-300 hover:scale-105">
      {/* 单圈橙色头像 */}
      <div className="relative h-28 w-28 transition-transform duration-300 hover:scale-110">
        <div className="absolute inset-0 rounded-full border-[5px] border-orange-500 shadow-md" />
        <div className="absolute inset-[5px] overflow-hidden rounded-full bg-white">
          <img
            src={person.img}
            alt={person.name}
            className="h-full w-full object-cover rounded-full"
            loading="lazy"
            draggable={false}
          />
        </div>
      </div>

      <div className="mt-4 text-lg font-extrabold">{person.name}</div>
      <div className="text-gray-700">{person.role}</div>
    </div>
  );
}

export default function HomePage() {
  const topX: Record<string, number> = {
    xiaofan: 1 / 6,
    ayush: 1 / 2,
    luke: 5 / 6,
  };

  const bottomX: Record<string, number> = {
    daniel: 1 / 10,
    noah: 3 / 10,
    erin: 5 / 10,
    dev: 7 / 10,
    darragh: 9 / 10,
  };

  const topY = 30;
  const bottomY = 78;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-14">
        <Card className="bg-white/95 backdrop-blur shadow-xl rounded-2xl">
          <CardHeader className="text-center space-y-3">
            <CardTitle className="text-5xl font-extrabold tracking-tight">
              Group 26
            </CardTitle>

            <p className="text-lg text-gray-600">
              Resilient Multi-Region Cloud-Native Restaurant Ordering System
            </p>

            <p className="text-orange-500 font-semibold">
              In collaboration with Toast
            </p>

            <div className="pt-3 flex flex-wrap justify-center gap-3">
              <Button asChild className="rounded-xl px-6">
                <Link to="/orders">Go to Orders</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl px-6 bg-white">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl px-6 bg-white">
                <Link to="/signup">Sign Up</Link>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pb-12">
            <h2 className="text-4xl font-extrabold text-center mt-6 mb-10">
              Team &amp; Roles
            </h2>

            <div className="relative rounded-2xl bg-[#f6d2cb] p-10 overflow-hidden">

              {/* SVG 连线 */}
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {/* 顶部横线 */}
                <line
                  x1={topX.xiaofan * 100}
                  y1={topY}
                  x2={topX.luke * 100}
                  y2={topY}
                  stroke="#ef6b3a"
                  strokeWidth="0.4"
                />

                {links.map((l) => {
                  const x1 = (topX as any)[l.from] * 100;
                  const x2 = (bottomX as any)[l.to] * 100;
                  const midY = (topY + bottomY) / 2;

                  return (
                    <g key={`${l.from}-${l.to}`}>
                      <line x1={x1} y1={topY} x2={x1} y2={midY} stroke="#ef6b3a" strokeWidth="0.4" />
                      <line x1={x1} y1={midY} x2={x2} y2={midY} stroke="#ef6b3a" strokeWidth="0.4" />
                      <line x1={x2} y1={midY} x2={x2} y2={bottomY} stroke="#ef6b3a" strokeWidth="0.4" />
                    </g>
                  );
                })}
              </svg>

              <div className="relative z-10">
                {/* 上排 */}
                <div className="grid grid-cols-3 gap-10 items-start">
                  {topRow.map((p) => (
                    <AvatarNode key={p.id} person={p} />
                  ))}
                </div>

                {/* 下排 */}
                <div className="mt-14 grid grid-cols-5 gap-8 items-start">
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