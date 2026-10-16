/** The parts a person can actually recognise on their own roof or wall. Plain words, safe next steps. */
export const PARTS = [
  {
    key: "surface",
    name: "Panel surface (the glass on top)",
    plain: "The shiny face of the panel. Dust, bird droppings, leaves and pollen sit here and block sunlight before it reaches the cells.",
    issue: "Soiling is one of the most common reasons output drifts down slowly rather than suddenly.",
    safeStep: "Look at the panels from the ground or a safe window. If they look dusty or spotted, ask your installer about cleaning — never climb on the roof yourself.",
    illustration: "dust",
  },
  {
    key: "frame",
    name: "Frame, rails and mounting",
    plain: "The metal frame around the glass and the rails that hold the panels down. They keep the panels at the right angle and resist wind.",
    issue: "Loose clamps, rusted rails or panels that look out of line may mean the mounting needs checking.",
    safeStep: "From a safe distance, note anything bent, loose or rusting, then pass the photo to your installer.",
    illustration: "install",
  },
  {
    key: "cables",
    name: "Visible cables",
    plain: "The cables that carry electricity from the panels to the inverter. They should be clipped and protected from sun and sharp edges.",
    issue: "Cable damage is an electrical safety matter, not something to fix informally.",
    safeStep: "Do not touch or move any cable. Note where you saw it and call a qualified installer.",
    illustration: "install",
  },
  {
    key: "junction",
    name: "Junction area / combiner box",
    plain: "Where the strings from the panels meet and are joined together.",
    issue: "Loose connections or water getting in can interrupt part of the array.",
    safeStep: "Keep the cover on and closed. Report it — only a qualified installer should open it.",
    illustration: "install",
  },
  {
    key: "inverter",
    name: "Inverter and its display",
    plain: "The box that converts panel electricity into the electricity your home uses. Its screen often shows today's energy and an error code.",
    issue: "A dark screen, a red light or an error code on days with good sun is worth reporting.",
    safeStep: "Read the display and photograph the code without opening the unit. Then contact your installer.",
    illustration: "inverter",
  },
  {
    key: "battery",
    name: "Battery (if you have one)",
    plain: "A battery keeps the extra energy made during the day so you can use it in the evening. It is optional — plenty of homes work without one.",
    issue: "A battery that gets very hot, hums or rattles loudly, or shows a fault light is worth reporting.",
    safeStep: "Do not open it, move it or stack anything against it. Note the light or sound and tell your installer.",
    illustration: "inverter",
  },
  {
    key: "home",
    name: "Your home (what the power feeds)",
    plain: "The electricity the system makes runs your lights, fridge, television and the sockets you already use — nothing changes about how you switch things on.",
    issue: "If appliances stop working while the system says it is producing, or a circuit keeps tripping, that needs a qualified electrician.",
    safeStep: "Carry on using your home normally, note when it happened, and pass it to your installer. Never open a distribution board yourself.",
    illustration: "install",
  },
  {
    key: "shade",
    name: "Shade objects (trees, tanks, buildings)",
    plain: "Anything between the sun and the panels. Shade on even one part of an array can pull down the whole string.",
    issue: "A tree that grew, a new water tank or a neighbouring building can quietly reduce output for many months.",
    safeStep: "Compare the shade at different times of day, note what changed, and ask your installer about safe mitigation.",
    illustration: "shade",
  },
];

export function partByKey(key) {
  return PARTS.find((p) => p.key === key) ?? PARTS[0];
}