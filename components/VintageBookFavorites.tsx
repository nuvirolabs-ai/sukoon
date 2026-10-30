"use client";

import React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { ShortcutItem } from "@/lib/favorites";

/**
 * High-fidelity Vintage Engraved Icons matching the user's reference artwork:
 * 1. Matchmaker: Antique brass nautical compass with sighting telescope
 * 2. Post a deal: Rustic timber log cabin with chimney smoke & barrels
 * 3. Trending Deals: Vintage financial chart with rising golden arrow & shaded bars
 * 4. Power Docs: Rolled parchment scroll with red ribbon & embossed wax seal
 * 5. Add Shortcut: Antique 8-point compass rose with central (+) plus mark
 * + High-fidelity engraved etchings for all other optional shortcuts.
 */
export function VintageShortcutIcon({
  iconType,
  className = "w-20 h-20",
}: {
  iconType: ShortcutItem["iconType"] | "add-shortcut";
  className?: string;
}) {
  switch (iconType) {
    case "matchmaking":
      // Antique Brass Compass with Sighting Telescope (Matchmaker)
      return (
        <svg
          viewBox="0 0 100 100"
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top brass loop */}
          <circle cx="50" cy="14" r="7.5" stroke="#7A5623" strokeWidth="2.5" fill="#E6CA85" />
          <path d="M46 20h8v4h-8z" fill="#7A5623" stroke="#4A3414" strokeWidth="1" />

          {/* Sighting telescope barrel attached at an angle */}
          <g transform="rotate(-36 50 56)">
            {/* Main brass tube */}
            <rect x="70" y="50" width="34" height="11" rx="2" fill="#2E4057" stroke="#1D2A3A" strokeWidth="1.5" />
            <rect x="74" y="48.5" width="4" height="14" rx="1" fill="#D4AF37" stroke="#7A5623" strokeWidth="1" />
            <rect x="94" y="48.5" width="4" height="14" rx="1" fill="#D4AF37" stroke="#7A5623" strokeWidth="1" />
            {/* Eyepiece / lens cap */}
            <path d="M104 52h4a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-4z" fill="#D4AF37" stroke="#5C3F18" strokeWidth="1.2" />
            {/* Objective lens glint */}
            <line x1="71" y1="52" x2="71" y2="59" stroke="#87CEEB" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* Main compass body outer brass ring */}
          <circle cx="48" cy="56" r="32" fill="#C99E52" stroke="#543A15" strokeWidth="2.5" />
          {/* Beveled shadow rim */}
          <circle cx="48" cy="56" r="29.5" fill="#8C682D" stroke="#3D290F" strokeWidth="1" />
          {/* Dial face with aged parchment tone */}
          <circle cx="48" cy="56" r="26" fill="#FBF4E4" stroke="#7A5623" strokeWidth="1.5" />

          {/* Dial tick marks & degree ring */}
          <circle cx="48" cy="56" r="23" stroke="#9E8055" strokeWidth="0.8" strokeDasharray="1.5 2" />

          {/* 8-Point Nautical Compass Rose */}
          <g transform="translate(48 56)">
            {/* NW-SE, NE-SW secondary points */}
            <polygon points="0,0 4,-14 0,-18 -4,-14" fill="#6E8294" stroke="#2C3B47" strokeWidth="0.6" transform="rotate(45)" />
            <polygon points="0,0 4,-14 0,-18 -4,-14" fill="#6E8294" stroke="#2C3B47" strokeWidth="0.6" transform="rotate(135)" />
            <polygon points="0,0 4,-14 0,-18 -4,-14" fill="#6E8294" stroke="#2C3B47" strokeWidth="0.6" transform="rotate(225)" />
            <polygon points="0,0 4,-14 0,-18 -4,-14" fill="#6E8294" stroke="#2C3B47" strokeWidth="0.6" transform="rotate(315)" />

            {/* Cardinal points with classic two-tone nautical shading */}
            {/* North (Blue-Grey / White) */}
            <polygon points="0,0 0,-22 5,-4" fill="#2E4A62" stroke="#1D2A3A" strokeWidth="0.8" />
            <polygon points="0,0 0,-22 -5,-4" fill="#E8DCC4" stroke="#1D2A3A" strokeWidth="0.8" />
            {/* South */}
            <polygon points="0,0 0,22 -5,4" fill="#2E4A62" stroke="#1D2A3A" strokeWidth="0.8" />
            <polygon points="0,0 0,22 5,4" fill="#E8DCC4" stroke="#1D2A3A" strokeWidth="0.8" />
            {/* East */}
            <polygon points="0,0 22,0 4,5" fill="#2E4A62" stroke="#1D2A3A" strokeWidth="0.8" />
            <polygon points="0,0 22,0 4,-5" fill="#E8DCC4" stroke="#1D2A3A" strokeWidth="0.8" />
            {/* West */}
            <polygon points="0,0 -22,0 -4,-5" fill="#2E4A62" stroke="#1D2A3A" strokeWidth="0.8" />
            <polygon points="0,0 -22,0 -4,5" fill="#E8DCC4" stroke="#1D2A3A" strokeWidth="0.8" />

            {/* Central brass pivot jewel */}
            <circle cx="0" cy="0" r="4.5" fill="#D4AF37" stroke="#4A3414" strokeWidth="1.2" />
            <circle cx="0" cy="0" r="2" fill="#8B2626" />
          </g>

          {/* Compass glass curved highlight reflection */}
          <path
            d="M28 42 A 25 25 0 0 1 68 42"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.65"
          />
        </svg>
      );

    case "post-deal":
      // Rustic Timber Log Cabin (Post a deal)
      return (
        <svg
          viewBox="0 0 100 100"
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Smoke curling from chimney */}
          <path
            d="M68 22 C66 18 72 14 69 10 C66 6 71 3 68 1"
            stroke="#9E8D7C"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeDasharray="2 1.5"
            fill="none"
          />

          {/* Stone Chimney */}
          <rect x="64" y="18" width="8" height="16" fill="#6B5B4E" stroke="#3D322A" strokeWidth="1.2" />
          <path d="M63 18h10v2.5H63z" fill="#4D3F35" stroke="#3D322A" strokeWidth="1" />
          <line x1="64" y1="24" x2="72" y2="24" stroke="#3D322A" strokeWidth="0.8" />
          <line x1="68" y1="24" x2="68" y2="30" stroke="#3D322A" strokeWidth="0.8" />

          {/* Cabin Gable Roof */}
          <polygon
            points="50,22 14,46 86,46"
            fill="#7A5636"
            stroke="#3E2613"
            strokeWidth="2"
          />
          {/* Overhanging ridge timber beam */}
          <line x1="50" y1="20" x2="50" y2="46" stroke="#4D321A" strokeWidth="2.2" />
          {/* Wooden shake roof plank texture */}
          <line x1="24" y1="41" x2="50" y2="23" stroke="#4D321A" strokeWidth="1.2" />
          <line x1="33" y1="44" x2="50" y2="27" stroke="#4D321A" strokeWidth="1.2" />
          <line x1="42" y1="45" x2="50" y2="33" stroke="#4D321A" strokeWidth="1.2" />
          <line x1="76" y1="41" x2="50" y2="23" stroke="#3E2613" strokeWidth="1.2" />
          <line x1="67" y1="44" x2="50" y2="27" stroke="#3E2613" strokeWidth="1.2" />
          <line x1="58" y1="45" x2="50" y2="33" stroke="#3E2613" strokeWidth="1.2" />
          <polygon points="50,22 11,46 16,48 50,25 84,48 89,46" fill="#A8794E" stroke="#3E2613" strokeWidth="1" />

          {/* Cabin Log Wall Base */}
          <rect x="20" y="46" width="60" height="34" fill="#B88A58" stroke="#3E2613" strokeWidth="2" />

          {/* Horizontal Interlocking Logs */}
          <line x1="20" y1="52" x2="80" y2="52" stroke="#59391B" strokeWidth="1.8" />
          <line x1="20" y1="58" x2="80" y2="58" stroke="#59391B" strokeWidth="1.8" />
          <line x1="20" y1="64" x2="80" y2="64" stroke="#59391B" strokeWidth="1.8" />
          <line x1="20" y1="70" x2="80" y2="70" stroke="#59391B" strokeWidth="1.8" />
          <line x1="20" y1="76" x2="80" y2="76" stroke="#59391B" strokeWidth="1.8" />

          {/* Log corner overlap rounds */}
          <g fill="#8C5C30" stroke="#3E2613" strokeWidth="1.2">
            <circle cx="18" cy="49" r="2.8" />
            <circle cx="18" cy="55" r="2.8" />
            <circle cx="18" cy="61" r="2.8" />
            <circle cx="18" cy="67" r="2.8" />
            <circle cx="18" cy="73" r="2.8" />
            <circle cx="82" cy="49" r="2.8" />
            <circle cx="82" cy="55" r="2.8" />
            <circle cx="82" cy="61" r="2.8" />
            <circle cx="82" cy="67" r="2.8" />
            <circle cx="82" cy="73" r="2.8" />
          </g>

          {/* Cabin Door */}
          <rect x="44" y="56" width="13" height="24" fill="#6B411D" stroke="#2B1607" strokeWidth="1.5" />
          <path d="M47 62h7M47 70h7M47 77h7" stroke="#3D2109" strokeWidth="1" />
          <circle cx="47" cy="68" r="1.2" fill="#D4AF37" />

          {/* Window Left with cozy amber panes */}
          <rect x="26" y="56" width="12" height="12" fill="#F7D376" stroke="#2B1607" strokeWidth="1.5" />
          <line x1="32" y1="56" x2="32" y2="68" stroke="#2B1607" strokeWidth="1.2" />
          <line x1="26" y1="62" x2="38" y2="62" stroke="#2B1607" strokeWidth="1.2" />

          {/* Window Right */}
          <rect x="63" y="56" width="12" height="12" fill="#F7D376" stroke="#2B1607" strokeWidth="1.5" />
          <line x1="69" y1="56" x2="69" y2="68" stroke="#2B1607" strokeWidth="1.2" />
          <line x1="63" y1="62" x2="75" y2="62" stroke="#2B1607" strokeWidth="1.2" />

          {/* Stone Foundation Porch Step */}
          <rect x="18" y="80" width="64" height="4" fill="#75675C" stroke="#3D322A" strokeWidth="1.5" rx="1" />

          {/* Rustic Cider Barrels next to porch */}
          <g>
            <ellipse cx="14" cy="77" rx="4" ry="7" fill="#8A5A36" stroke="#3E2613" strokeWidth="1.2" />
            <line x1="10" y1="74" x2="18" y2="74" stroke="#221206" strokeWidth="1" />
            <line x1="10" y1="80" x2="18" y2="80" stroke="#221206" strokeWidth="1" />
          </g>
        </svg>
      );

    case "trending":
      // Vintage Financial Chart with Rising Golden Arrow (Trending Deals)
      return (
        <svg
          viewBox="0 0 100 100"
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Coordinate axes */}
          <line x1="18" y1="18" x2="18" y2="78" stroke="#4A3414" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="18" y1="78" x2="88" y2="78" stroke="#4A3414" strokeWidth="2.2" strokeLinecap="round" />

          {/* Axis ticks */}
          <line x1="15" y1="32" x2="18" y2="32" stroke="#4A3414" strokeWidth="1.5" />
          <line x1="15" y1="46" x2="18" y2="46" stroke="#4A3414" strokeWidth="1.5" />
          <line x1="15" y1="60" x2="18" y2="60" stroke="#4A3414" strokeWidth="1.5" />

          {/* Dashed background guide lines */}
          <line x1="18" y1="32" x2="86" y2="32" stroke="#D1BE9B" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="18" y1="46" x2="86" y2="46" stroke="#D1BE9B" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="18" y1="60" x2="86" y2="60" stroke="#D1BE9B" strokeWidth="1" strokeDasharray="2 2" />

          {/* Shaded Vintage Chart Columns */}
          {/* Bar 1: Sepia Ochre */}
          <rect x="25" y="62" width="10" height="16" fill="#D69E58" stroke="#543A15" strokeWidth="1.5" />
          <line x1="27" y1="64" x2="33" y2="76" stroke="#543A15" strokeWidth="0.8" />
          <line x1="30" y1="64" x2="34" y2="72" stroke="#543A15" strokeWidth="0.8" />

          {/* Bar 2: Antique Sage Forest */}
          <rect x="38" y="52" width="10" height="26" fill="#4B7A66" stroke="#1D3E30" strokeWidth="1.5" />
          <line x1="40" y1="55" x2="46" y2="76" stroke="#1D3E30" strokeWidth="0.8" />
          <line x1="43" y1="55" x2="47" y2="72" stroke="#1D3E30" strokeWidth="0.8" />

          {/* Bar 3: Vintage Slate Teal */}
          <rect x="51" y="44" width="10" height="34" fill="#3D6B78" stroke="#18363F" strokeWidth="1.5" />
          <line x1="53" y1="48" x2="59" y2="76" stroke="#18363F" strokeWidth="0.8" />
          <line x1="56" y1="48" x2="60" y2="72" stroke="#18363F" strokeWidth="0.8" />

          {/* Bar 4: Antique Dark Spruce */}
          <rect x="64" y="36" width="10" height="42" fill="#2E5445" stroke="#132B22" strokeWidth="1.5" />
          <line x1="66" y1="40" x2="72" y2="76" stroke="#132B22" strokeWidth="0.8" />
          <line x1="69" y1="40" x2="73" y2="72" stroke="#132B22" strokeWidth="0.8" />

          {/* Dashed trajectory line */}
          <path
            d="M26 58 Q 38 42, 54 44 T 78 26"
            stroke="#4A3414"
            strokeWidth="1.8"
            strokeDasharray="2.5 2.5"
            fill="none"
          />

          {/* Big Ascending Golden Arrow */}
          <path
            d="M22 66 L 38 52 L 52 56 L 76 24"
            stroke="#D97A24"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M22 66 L 38 52 L 52 56 L 76 24"
            stroke="#5C2E0A"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Arrowhead */}
          <polygon
            points="76,17 84,28 72,27"
            fill="#E68524"
            stroke="#5C2E0A"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "power-docs":
      // Antique Rolled Parchment Scroll with Wax Seal & Ribbon (Power Docs)
      return (
        <svg
          viewBox="0 0 100 100"
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Upper wooden dowel rod & turned finials */}
          <rect x="22" y="19" width="56" height="5.5" rx="1.5" fill="#5A3A1E" stroke="#36200D" strokeWidth="1.2" />
          <ellipse cx="22" cy="21.75" rx="3.5" ry="5.5" fill="#7A4E29" stroke="#36200D" strokeWidth="1.2" />
          <ellipse cx="78" cy="21.75" rx="3.5" ry="5.5" fill="#7A4E29" stroke="#36200D" strokeWidth="1.2" />

          {/* Main unfurling parchment scroll body */}
          <path
            d="M26 24.5 L74 24.5 L70 74 C70 76 66 78 62 78 L34 78 C30 78 26 76 26 74 Z"
            fill="#F6EEDA"
            stroke="#634B28"
            strokeWidth="2"
          />
          {/* Subtle parchment curl gradient / inner shadow */}
          <path
            d="M26 24.5 L30 75 L34 78 L26 74 Z"
            fill="#DBC79F"
            opacity="0.7"
          />
          <path
            d="M74 24.5 L70 74 L66 78 L70 75 Z"
            fill="#DBC79F"
            opacity="0.7"
          />

          {/* Lower rolled wooden dowel rod */}
          <rect x="24" y="73" width="52" height="6.5" rx="2" fill="#5A3A1E" stroke="#36200D" strokeWidth="1.5" />
          <ellipse cx="24" cy="76.25" rx="3.5" ry="5.5" fill="#7A4E29" stroke="#36200D" strokeWidth="1.2" />
          <ellipse cx="76" cy="76.25" rx="3.5" ry="5.5" fill="#7A4E29" stroke="#36200D" strokeWidth="1.2" />

          {/* Calligraphic script lines on deed */}
          <path d="M34 34h28M34 40h32M34 46h26M34 52h30M34 58h22" stroke="#8C7355" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="3.5 2.5" />

          {/* Signature flourish at bottom */}
          <path d="M34 66 Q40 63, 44 67 T52 65" stroke="#3E2B17" strokeWidth="1.5" strokeLinecap="round" fill="none" />

          {/* Crimson silk ribbons hanging down */}
          <path d="M64 52 L61 87 L65 85 L69 87 Z" fill="#992323" stroke="#520F0F" strokeWidth="1.2" />
          <path d="M68 54 L66 84 L70 82 L74 84 Z" fill="#7A1818" stroke="#450C0C" strokeWidth="1" />

          {/* Embossed Crimson Wax Seal */}
          <circle cx="66" cy="67" r="10.5" fill="#A82828" stroke="#4A0E0E" strokeWidth="1.8" />
          {/* Outer wavy wax stamp rim */}
          <circle cx="66" cy="67" r="8.5" fill="#8C1C1C" stroke="#B83A3A" strokeWidth="1" />
          {/* Monogram emblem inside seal */}
          <circle cx="66" cy="67" r="6" fill="#A82828" stroke="#520F0F" strokeWidth="0.8" />
          <path d="M63 65 L66 69 L69 65" stroke="#FFD700" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="66" cy="64.5" r="1" fill="#FFD700" />
        </svg>
      );

    case "add-shortcut":
      // Antique 8-Point Nautical Compass Star with Central (+) Plus
      return (
        <svg
          viewBox="0 0 100 100"
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer hairline compass rings */}
          <circle cx="50" cy="50" r="38" stroke="#7A5623" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.6" />
          <circle cx="50" cy="50" r="34" stroke="#4A3414" strokeWidth="1.8" />
          <circle cx="50" cy="50" r="30" stroke="#7A5623" strokeWidth="0.8" />

          {/* Cardinal tick marks */}
          <line x1="50" y1="12" x2="50" y2="16" stroke="#4A3414" strokeWidth="1.8" />
          <line x1="50" y1="84" x2="50" y2="88" stroke="#4A3414" strokeWidth="1.8" />
          <line x1="12" y1="50" x2="16" y2="50" stroke="#4A3414" strokeWidth="1.8" />
          <line x1="84" y1="50" x2="88" y2="50" stroke="#4A3414" strokeWidth="1.8" />

          {/* Secondary 4 points */}
          <g transform="rotate(45 50 50)">
            <polygon points="50,50 53,24 50,18 47,24" fill="#8C7355" stroke="#3D2B17" strokeWidth="0.8" />
            <polygon points="50,50 53,76 50,82 47,76" fill="#8C7355" stroke="#3D2B17" strokeWidth="0.8" />
            <polygon points="50,50 76,53 82,50 76,47" fill="#8C7355" stroke="#3D2B17" strokeWidth="0.8" />
            <polygon points="50,50 24,53 18,50 24,47" fill="#8C7355" stroke="#3D2B17" strokeWidth="0.8" />
          </g>

          {/* 4 Primary Cardinal Points with Faceted Antique Shading */}
          {/* North */}
          <polygon points="50,50 50,16 56,42" fill="#2B1D10" stroke="#2B1D10" strokeWidth="1" />
          <polygon points="50,50 50,16 44,42" fill="#F4EADB" stroke="#2B1D10" strokeWidth="1" />
          {/* South */}
          <polygon points="50,50 50,84 44,58" fill="#2B1D10" stroke="#2B1D10" strokeWidth="1" />
          <polygon points="50,50 50,84 56,58" fill="#F4EADB" stroke="#2B1D10" strokeWidth="1" />
          {/* East */}
          <polygon points="50,50 84,50 58,56" fill="#2B1D10" stroke="#2B1D10" strokeWidth="1" />
          <polygon points="50,50 84,50 58,44" fill="#F4EADB" stroke="#2B1D10" strokeWidth="1" />
          {/* West */}
          <polygon points="50,50 16,50 42,44" fill="#2B1D10" stroke="#2B1D10" strokeWidth="1" />
          <polygon points="50,50 16,50 42,56" fill="#F4EADB" stroke="#2B1D10" strokeWidth="1" />

          {/* Central brass ring & hub */}
          <circle cx="50" cy="50" r="14" fill="#D9BA76" stroke="#4A3414" strokeWidth="2" />
          <circle cx="50" cy="50" r="11" fill="#FAF3E3" stroke="#7A5623" strokeWidth="1.2" />

          {/* Central Crisp Plus Symbol (+) */}
          <line x1="42" y1="50" x2="58" y2="50" stroke="#2B1D10" strokeWidth="3" strokeLinecap="round" />
          <line x1="50" y1="42" x2="50" y2="58" stroke="#2B1D10" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case "guidelines":
      // Antique Architect's Checklist & Fountain Pen
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="22" y="16" width="56" height="68" rx="4" fill="#F6EEDA" stroke="#543A15" strokeWidth="2.2" />
          <path d="M40 13h20v6H40z" fill="#C99E52" stroke="#543A15" strokeWidth="1.5" rx="1" />
          <line x1="32" y1="30" x2="68" y2="30" stroke="#8C7355" strokeWidth="1.5" />
          <line x1="32" y1="42" x2="68" y2="42" stroke="#8C7355" strokeWidth="1.5" />
          <line x1="32" y1="54" x2="68" y2="54" stroke="#8C7355" strokeWidth="1.5" />
          <line x1="32" y1="66" x2="56" y2="66" stroke="#8C7355" strokeWidth="1.5" />
          {/* Checkmarks */}
          <path d="M30 29l2.5 2.5 5-5" stroke="#1E5637" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M30 41l2.5 2.5 5-5" stroke="#1E5637" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M30 53l2.5 2.5 5-5" stroke="#1E5637" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {/* Antique fountain pen at angle */}
          <path d="M68 56 L86 74 L82 78 L64 60 Z" fill="#2E4057" stroke="#1D2A3A" strokeWidth="1.5" />
          <polygon points="64,60 58,62 60,56" fill="#D4AF37" stroke="#4A3414" strokeWidth="1" />
        </svg>
      );

    case "docs":
    case "details":
    case "portfolio":
      // Antique Leather Deed Binder / Stately Manor
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="22" y="18" width="56" height="64" rx="4" fill="#7A4E29" stroke="#38210C" strokeWidth="2.5" />
          <rect x="26" y="22" width="48" height="56" rx="2" fill="#946135" stroke="#38210C" strokeWidth="1.2" />
          <path d="M34 18v64" stroke="#38210C" strokeWidth="2.5" />
          <rect x="42" y="44" width="22" height="14" rx="2" fill="#D4AF37" stroke="#4A3414" strokeWidth="1.5" />
          <circle cx="53" cy="51" r="2.5" fill="#38210C" />
          {/* Corner brass braces */}
          <polygon points="22,18 30,18 22,26" fill="#D4AF37" stroke="#4A3414" strokeWidth="1" />
          <polygon points="78,18 70,18 78,26" fill="#D4AF37" stroke="#4A3414" strokeWidth="1" />
          <polygon points="78,82 70,82 78,74" fill="#D4AF37" stroke="#4A3414" strokeWidth="1" />
          <polygon points="22,82 30,82 22,74" fill="#D4AF37" stroke="#4A3414" strokeWidth="1" />
        </svg>
      );

    case "journey":
    case "site":
      // Antique Surveyor's Transit Theodolite
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Tripod legs */}
          <line x1="50" y1="52" x2="24" y2="84" stroke="#543A15" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="50" y1="52" x2="50" y2="86" stroke="#543A15" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="50" y1="52" x2="76" y2="84" stroke="#543A15" strokeWidth="2.5" strokeLinecap="round" />
          {/* Brass Leveling base */}
          <rect x="42" y="48" width="16" height="5" fill="#D4AF37" stroke="#4A3414" strokeWidth="1.2" />
          {/* Vertical standards */}
          <line x1="45" y1="48" x2="45" y2="34" stroke="#4A3414" strokeWidth="2" />
          <line x1="55" y1="48" x2="55" y2="34" stroke="#4A3414" strokeWidth="2" />
          {/* Telescope tube */}
          <rect x="22" y="30" width="56" height="8" rx="1.5" fill="#2E4057" stroke="#1D2A3A" strokeWidth="1.5" transform="rotate(-12 50 34)" />
          <rect x="18" y="29.5" width="6" height="9" fill="#D4AF37" stroke="#4A3414" strokeWidth="1" transform="rotate(-12 50 34)" />
          <circle cx="50" cy="34" r="5" fill="#D4AF37" stroke="#4A3414" strokeWidth="1.2" />
        </svg>
      );

    case "buy":
      // Antique Victorian Skeleton Key with Ribbon
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Key bow ring */}
          <circle cx="50" cy="28" r="14" fill="#D4AF37" stroke="#4A3414" strokeWidth="2" />
          <circle cx="50" cy="28" r="8" fill="#F6EEDA" stroke="#4A3414" strokeWidth="1.5" />
          {/* Key shaft */}
          <rect x="47.5" y="42" width="5" height="38" fill="#D4AF37" stroke="#4A3414" strokeWidth="1.8" />
          {/* Key bit */}
          <path d="M52.5 68h10v5h-5v4h6v5h-11z" fill="#D4AF37" stroke="#4A3414" strokeWidth="1.8" />
          {/* Silk ribbon tie */}
          <path d="M50 42 C40 44 34 52 38 62 C42 70 48 64 50 56" stroke="#992323" strokeWidth="2" fill="none" />
        </svg>
      );

    default:
      // Antique Seal Crest
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="32" fill="#EBDDBF" stroke="#543A15" strokeWidth="2" />
          <circle cx="50" cy="50" r="26" stroke="#8C682D" strokeWidth="1" strokeDasharray="2 2" />
          <path d="M38 50h24M50 38v24" stroke="#543A15" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
  }
}

/**
 * Hand-drawn Pine Tree Engraving SVG
 */
export function VintagePineTree({ className = "w-6 h-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 78V10" stroke="#3D2914" strokeWidth="2" strokeLinecap="round" />
      {/* Tier 1 top */}
      <path d="M20 10 L15 22 L20 20 L25 22 Z" fill="#2E4230" stroke="#1B291C" strokeWidth="1" />
      {/* Tier 2 */}
      <path d="M20 20 L12 34 L19 32 L28 34 Z" fill="#2A3D2C" stroke="#1B291C" strokeWidth="1" />
      {/* Tier 3 */}
      <path d="M19 32 L9 48 L18 45 L31 48 Z" fill="#243626" stroke="#162117" strokeWidth="1" />
      {/* Tier 4 */}
      <path d="M18 45 L6 62 L18 58 L34 62 Z" fill="#1E2E20" stroke="#121C13" strokeWidth="1" />
      {/* Base needle hatching */}
      <line x1="16" y1="62" x2="16" y2="76" stroke="#3D2914" strokeWidth="1" />
      <line x1="24" y1="62" x2="24" y2="76" stroke="#3D2914" strokeWidth="1" />
    </svg>
  );
}

/**
 * Hand-drawn Alpine Mountain Ridge Sketch
 */
export function VintageMountainSketch({ className = "w-20 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 50" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background ridge */}
      <polygon points="10,50 38,18 64,50" fill="#E8DEC5" stroke="#4A3414" strokeWidth="1.2" />
      <line x1="38" y1="18" x2="44" y2="50" stroke="#4A3414" strokeWidth="1" />
      {/* Fore mountain */}
      <polygon points="36,50 68,10 94,50" fill="#DFCFAe" stroke="#38260E" strokeWidth="1.5" />
      {/* Shading lines on right face */}
      <line x1="68" y1="10" x2="72" y2="50" stroke="#38260E" strokeWidth="1.2" />
      <line x1="72" y1="20" x2="79" y2="28" stroke="#38260E" strokeWidth="0.8" />
      <line x1="74" y1="27" x2="83" y2="36" stroke="#38260E" strokeWidth="0.8" />
      <line x1="76" y1="35" x2="87" y2="44" stroke="#38260E" strokeWidth="0.8" />
      {/* Small pine trees in foothills */}
      <path d="M86 48 L88 42 L90 48 Z" fill="#243626" stroke="#121C13" strokeWidth="0.6" />
      <path d="M91 49 L93 40 L95 49 Z" fill="#243626" stroke="#121C13" strokeWidth="0.6" />
      <path d="M96 50 L98 44 L100 50 Z" fill="#243626" stroke="#121C13" strokeWidth="0.6" />
    </svg>
  );
}

/**
 * Vintage Ornate Corner Filigree / Flourish
 */
export function VintageCornerFlourish({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 30 V12 C2 6 6 2 12 2 H30 M2 2 L14 14 M6 2 C6 8 10 12 16 12 M2 6 C8 6 12 10 12 16"
        stroke="#6E502B"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="10" cy="10" r="1.5" fill="#6E502B" />
    </svg>
  );
}

/**
 * Main Vintage Book Style My Favorites Component
 */
export function VintageBookFavorites({
  favoriteItems,
  onOpenCustomize,
}: {
  favoriteItems: ShortcutItem[];
  onOpenCustomize: () => void;
}) {
  return (
    <section aria-label="My Favorites — Sukoon Field Journal" className="my-6 relative">
      {/* Outer Open-Book Wrapper with Antique Leather Edge & Multi-Page Stack Depth */}
      <div className="relative rounded-2xl md:rounded-3xl p-1 sm:p-2 bg-gradient-to-br from-[#3B2211] via-[#2A170A] to-[#1F1007] shadow-[0_12px_36px_rgba(0,0,0,0.35),0_2px_8px_rgba(0,0,0,0.2)] border border-[#52331C]">
        {/* Under-lying Stacked Antique Pages Edge (Simulates hundreds of book pages) */}
        <div className="absolute -bottom-1.5 inset-x-3 h-2 bg-[#D9C8A3] rounded-b-xl border-b border-[#9C855B] shadow-inner opacity-90" />
        <div className="absolute -bottom-2.5 inset-x-5 h-2 bg-[#CBB58B] rounded-b-xl border-b border-[#806B45] opacity-80" />

        {/* The Open Book Parchment Page */}
        <div className="relative rounded-xl md:rounded-2xl bg-gradient-to-b from-[#F7EEDC] via-[#FAF3E4] to-[#F1E5CE] p-3 sm:p-5 text-[#2C1D11] overflow-hidden border border-[#D5C299] shadow-inner">
          {/* Subtle Gutter Spine Shadow on Right Edge (Open Book Fold) */}
          <div
            className="absolute top-0 right-0 bottom-0 w-8 pointer-events-none z-10"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(50, 30, 15, 0.08) 60%, rgba(35, 20, 10, 0.18) 100%)",
            }}
          />

          {/* Ornate Engraved Border Frame */}
          <div className="border border-[#7A582F]/40 rounded-lg p-2.5 sm:p-3 relative">
            {/* Inner Hairline Frame */}
            <div className="border border-[#8C682D]/25 rounded-sm p-2 sm:p-3">
              {/* Corner Filigrees */}
              <div className="absolute top-3 left-3 pointer-events-none">
                <VintageCornerFlourish className="w-5 h-5 text-[#6E502B]" />
              </div>
              <div className="absolute top-3 right-3 pointer-events-none rotate-90">
                <VintageCornerFlourish className="w-5 h-5 text-[#6E502B]" />
              </div>
              <div className="absolute bottom-3 left-3 pointer-events-none -rotate-90">
                <VintageCornerFlourish className="w-5 h-5 text-[#6E502B]" />
              </div>
              <div className="absolute bottom-3 right-3 pointer-events-none rotate-180">
                <VintageCornerFlourish className="w-5 h-5 text-[#6E502B]" />
              </div>

              {/* BOOK HEADER: "SUKOON" with Vintage Double-Line Serifs & Flanking Pine Trees */}
              <div className="flex items-center justify-between border-b border-[#8C682D]/30 pb-2.5 mb-4 px-2">
                {/* Left Pine Trees */}
                <div className="flex items-end gap-1 opacity-80">
                  <VintagePineTree className="w-4 h-9 sm:w-5 h-11" />
                  <VintagePineTree className="w-3.5 h-7 sm:w-4 h-8" />
                </div>

                {/* Central Engraved Title */}
                <div className="text-center">
                  <h2
                    className="text-[26px] sm:text-[32px] font-black tracking-[0.2em] uppercase text-[#3D2512] vintage-book-font drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]"
                    style={{
                      WebkitTextStroke: "0.5px #26160A",
                    }}
                  >
                    SUKOON
                  </h2>
                  <div className="flex items-center justify-center gap-2 mt-0.5">
                    <span className="w-6 h-[1px] bg-[#8C682D]/40" />
                    <span className="text-[9px] sm:text-[10px] font-serif italic tracking-widest uppercase text-[#735431]">
                      Field Journal · My Favorites
                    </span>
                    <span className="w-6 h-[1px] bg-[#8C682D]/40" />
                  </div>
                </div>

                {/* Right Pine Trees & Quick Customize Button */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-end gap-1 opacity-80">
                    <VintagePineTree className="w-3.5 h-7 sm:w-4 h-8" />
                    <VintagePineTree className="w-4 h-9 sm:w-5 h-11" />
                  </div>
                  <button
                    type="button"
                    onClick={onOpenCustomize}
                    aria-label="Customize Favorites"
                    title="Customize Shortcuts"
                    className="tap-scale ml-1 p-1 rounded-full bg-[#EBD8B2] hover:bg-[#DFC99D] border border-[#8C682D]/40 text-[#4A3217] transition-all shadow-2xs"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              {/* BOOK SHORTCUTS GRID (2-Column Hand-Drawn Layout Matching Reference) */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:gap-x-6 sm:gap-y-6 pt-1 pb-3">
                {favoriteItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="tap-scale group flex flex-col items-center text-center p-1.5 sm:p-2 rounded-xl transition-transform hover:scale-[1.02] focus:outline-none"
                  >
                    {/* Hand-Drawn Engraved Icon Artwork */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.12)] transition-transform duration-200 group-hover:scale-105">
                      <VintageShortcutIcon iconType={item.iconType} className="w-full h-full" />
                    </div>

                    {/* Cursive / Calligraphic Script Title */}
                    <span className="vintage-script text-[24px] sm:text-[27px] text-[#2C190B] leading-none block font-normal tracking-wide">
                      {item.title}
                    </span>

                    {/* Antique Serif Subtitle */}
                    <span className="font-serif italic text-[11px] sm:text-[12px] text-[#694E2F] leading-tight mt-0.5 block max-w-full truncate">
                      {item.subtitle}
                    </span>
                  </Link>
                ))}

                {/* Add Shortcut Slot (Antique Compass Rose with Plus) */}
                <button
                  type="button"
                  onClick={onOpenCustomize}
                  className="tap-scale group flex flex-col items-center text-center p-1.5 sm:p-2 rounded-xl transition-transform hover:scale-[1.02] focus:outline-none"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)] transition-transform duration-200 group-hover:scale-105">
                    <VintageShortcutIcon iconType="add-shortcut" className="w-full h-full" />
                  </div>

                  <span className="vintage-script text-[24px] sm:text-[27px] text-[#2C190B] leading-none block font-normal tracking-wide group-hover:text-[#8C521F]">
                    Add Shortcut
                  </span>

                  <span className="font-serif italic text-[11px] sm:text-[12px] text-[#694E2F] leading-tight mt-0.5 block">
                    Pick feature
                  </span>
                </button>
              </div>

              {/* BOOK BOTTOM SKETCHES: Pine tree on left, Mountain peaks on right (from reference image) */}
              <div className="flex items-end justify-between px-2 pt-1 border-t border-[#8C682D]/20 mt-2 pointer-events-none">
                <div className="flex items-end gap-1 opacity-75">
                  <VintagePineTree className="w-3.5 h-8" />
                </div>

                <div className="text-[9px] font-serif italic text-[#8A6A44] tracking-wider">
                  Page 1 · Sukoon Ledger
                </div>

                <div className="opacity-75">
                  <VintageMountainSketch className="w-16 h-8 sm:w-20 sm:h-9" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
