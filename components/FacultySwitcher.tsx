"use client";

import { useState, useRef, useEffect } from "react";

export interface Faculty {
  id: string;
  name: string;
  department: string;
  courses: string[];
}

function initials(name: string) {
  return name
    .split(" ")
    .filter((w) => w[0] === w[0].toUpperCase())
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
}

// Stable avatar colours per faculty so they don't shift on re-render
const AVATAR_COLORS = ["#4f46e5", "#0891b2", "#7c3aed"];

interface FacultySwitcherProps {
  faculty: Faculty[];
  active: Faculty;
  onSwitch: (f: Faculty) => void;
}

export function FacultySwitcher({ faculty, active, onSwitch }: FacultySwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const activeIdx = faculty.findIndex((f) => f.id === active.id);
  const color = AVATAR_COLORS[activeIdx] ?? AVATAR_COLORS[0];

  return (
    <div className="pl-faculty-switcher" ref={ref}>
      <button
        className="pl-faculty-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        type="button"
      >
        <span className="pl-avatar" style={{ background: color }}>
          {initials(active.name)}
        </span>
        <span className="pl-faculty-info">
          <span className="pl-faculty-name">{active.name}</span>
          <span className="pl-faculty-dept">{active.department}</span>
        </span>
        <svg
          className="pl-faculty-chevron"
          viewBox="0 0 16 16"
          width="14"
          height="14"
          fill="none"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="pl-faculty-dropdown">
          <div className="pl-dropdown-label">Switch faculty</div>
          {faculty.map((f, i) => {
            const isActive = f.id === active.id;
            return (
              <button
                key={f.id}
                className={`pl-dropdown-item ${isActive ? "pl-dropdown-active" : ""}`}
                onClick={() => {
                  onSwitch(f);
                  setOpen(false);
                }}
                type="button"
              >
                <span className="pl-avatar pl-avatar-sm" style={{ background: AVATAR_COLORS[i] }}>
                  {initials(f.name)}
                </span>
                <span className="pl-dropdown-item-info">
                  <span className="pl-dropdown-item-name">{f.name}</span>
                  <span className="pl-dropdown-item-courses">
                    {f.courses.length} {f.courses.length === 1 ? "course" : "courses"}
                  </span>
                </span>
                {isActive && (
                  <svg className="pl-dropdown-check" viewBox="0 0 16 16" width="14" height="14" fill="none">
                    <path d="M3 8.5l3.5 3.5L13 5" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
