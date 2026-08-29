Modify the existing hero section of my React portfolio website. Do NOT redesign the rest of the page. Keep the current character, project carousel, navigation, typography style, spacing, positioning, proportions, and overall black-and-white aesthetic exactly as they are.

I only want to replace the current main hero heading with a dynamic two-part heading:

I DESIGN
I BUILD
I CODE
I CREATE
I SHIP
I ITERATE
I EXPERIMENT

The "I" must remain completely fixed. Only the second word should change.

ANIMATION:

I do NOT want a basic text carousel where the word simply fades out and another word appears.

Create a premium kinetic typography animation using an appropriate React animation solution such as Motion/Framer Motion, GSAP, or another animation library already available in the project.

The changing word should have a smooth, subtle 3D/vertical transition:

- The current word moves upward and slightly into/out of depth as it exits.
- The next word enters smoothly from below.
- Add subtle perspective/3D rotation to make the transition feel physical.
- Use sophisticated easing or spring physics rather than a linear animation.
- Keep each transition around 500–800ms.
- Pause briefly between words so they are easy to read.
- Loop continuously.
- Keep the animation elegant and restrained.
- Do NOT use excessive bouncing, blur, glow, scaling, or flashy effects.

CRITICAL — CENTER ALIGNMENT:

The changing words have different widths, so they MUST always share exactly the same horizontal center point.

For example, when changing:

I CODE
→
I EXPERIMENT

"EXPERIMENT" must expand equally to the left and right around the exact same center axis. It must NOT appear to move toward the right simply because it is wider.

Likewise:

I SHIP
I DESIGN
I ITERATE
I EXPERIMENT

must all have their visual center in exactly the same position.

Use a fixed/center-anchored container for the changing word. The text should be mathematically centered inside that container, with the center point remaining constant regardless of the word's width.

During the animation, both the outgoing and incoming words must remain centered on this exact same axis. Their different widths must never cause horizontal movement, layout shifting, or movement of the "I".

The heading should visually behave like:

        I
        |
   SAME CENTER AXIS
        |
DESIGN / EXPERIMENT / CODE / ITERATE

The entire heading should feel locked to the center while the typography itself moves.

IMPORTANT:
Do not solve this by giving each word a different manual left position. Use proper centering with a fixed or dynamically measured container so every word is genuinely centered.

LAYOUT:

Keep the heading in exactly the same location as the current main heading and preserve its relationship with the project carousel and character underneath it.

The heading should remain extremely large, bold, and visually dominant.

The "I" and changing word should feel like one single typographic statement rather than two separate UI elements.

Do NOT add:
- dots
- pagination indicators
- arrows
- pills
- labels
- progress bars
- controls
- backgrounds around the words
- any UI indicating which word is active

The typography itself should communicate the interaction.

RESPONSIVENESS:

Make everything fully responsive.

On mobile:
- Scale the typography appropriately.
- Keep the changing word perfectly centered.
- Prevent horizontal overflow.
- Make sure long words such as "EXPERIMENT" fit cleanly.
- Do not allow the animation to push or shift the surrounding layout.

Respect prefers-reduced-motion and provide a simple static/non-animated word change for users who have reduced motion enabled.

Most importantly, preserve the existing design. This is an enhancement to the hero heading, NOT a redesign of the portfolio.

The final effect should feel like a high-end creative/design portfolio where the hero typography is alive:

I DESIGN → I BUILD → I CODE → I CREATE → I SHIP → I ITERATE → I EXPERIMENT

Prioritize smooth animation, perfect center alignment, typography, depth, and visual restraint.