import React, { useState } from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  Stack,
  Slider,
  Paper
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase"; // adjust path if needed
import { doc, setDoc } from "firebase/firestore";

const questions = [
  "When challenges arise, I determine the solution from my experience and expertise.",
  "I am careful to acknowledge and admit my mistakes to my team.",
  "I communicate the long-term vision to the company often and in different ways.",
  "I have a visible reaction to difficult or bad news that is shared with me about the company/team/project (i.e., non-verbal, emotional, or sounds)",
  "I consistently ask for honest feedback from my employees in different ways.",
  "I consistently dialogue with employees about their lives to demonstrate that I care about them.",
  "When speaking with individual employees, I make sure to connect what they do to the company's continued success.",
  "I empower my immediate team to do their jobs without handholding.",
  "I talk about the vision and purpose of the company at every team and company gathering.",
  "I consistently expresses detailed gratitude for both high AND low performing employees.",
  "When the learning from a team member’s mistake will benefit the whole team, I intentionally address the entire team about it to ensure consistency.",
  "I vocally encourage employees to reserve time for creativity or process improvement within their role.",
  "I am intentional about hiring employees that equally fit the need and the company culture and values.",
  "My response to dissenting viewpoints shows the team that challenging one another is good thing that leads to growth and innovation.",
  "I am known among employees for one-line phrases like \"do what's right,\" \"challenges mean learning,\" or \"we're in this together.\" (Perhaps, even jokes about it exist among employees.)",
  "I have more answers than I do questions in our team discussions or meetings.",
  "It is important that our employee performance metrics are directly connected to their work AND in their full control.",
  "I consistently seek interactions with employees “organically” to hear their thoughts about a project, idea, or recent decision.",
  "I make time to review both the good and bad of a project or experience so that we can improve for next time.",
  "I consistently communicate what matters for our work.",
  "Affirming a team too much can lead to complacency and entitlement.",
  "I solicit employee opinions, concerns, and ideas in a genuine and diversified way.",
  "I openly share with my team when I am struggling professionally.",
  "I communicate processes, vision, and expectations so much that I am tired of hearing it.",
  "It is important to me that we celebrate our employees' big moments like the first day, work anniversaries, personal-milestones, etc.",
  "I am confident we have a shared language at work that goes beyond product codes, acronyms, and job related shorthand.",
  "I communicate that failure is inevitable and celebrate the associated learning.",
  "I regularly meet with my immediate team members to discuss their professional goals and the adjustments I see they could make that can help them reach those goals.",
  "I regularly and intentionally seek to learn from our employees, especially the newer ones.",
  "Our company metrics are clearly and directly aimed at the mission and NOT just the bottom line.",
  "I hand projects over to others and trust them to have equal or greater success than I would doing it myself.",
  "I know the limits of my natural strengths and that I need others to successfully achieve the height of the company's mission and vision."
];

export default function SocietalNormAssessment() {
  const [responses, setResponses] = useState(Array(questions.length).fill(5));
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleSliderChange = (index, value) => {
    const newResponses = [...responses];
    newResponses[index] = value;
    setResponses(newResponses);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const sessionId = localStorage.getItem("sessionId");
if (!sessionId) {
  console.error("Missing sessionId – intake form must be completed first.");
  navigate("/form");
  return;
}
await setDoc(doc(db, "societalNorms", sessionId), {
  responses,
  timestamp: new Date().toISOString()
});
      navigate("/campaign-builder", { state: { norms: responses } });
    } catch (err) {
      console.error("Error saving norms:", err);
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 5, minHeight: "100vh", bgcolor: "background.default" }}>
      <Container maxWidth="md">
        <Typography variant="h4" gutterBottom>
          Societal Norms Assessment
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Please respond to each statement on a scale of 1 (Never) to 10 (Always).
        </Typography>

        <Stack spacing={3}>
          {questions.map((q, idx) => (
            <Paper key={idx} sx={{ p: 2 }}>
              <Typography gutterBottom>{q}</Typography>
              <Slider
                value={responses[idx]}
                onChange={(_, val) => handleSliderChange(idx, val)}
                step={1}
                min={1}
                max={10}
                marks={[
                  { value: 1, label: "Never" },
                  { value: 10, label: "Always" }
                ]}
                valueLabelDisplay="auto"
              />
            </Paper>
          ))}
        </Stack>

        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Saving..." : "Submit Assessment"}
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
