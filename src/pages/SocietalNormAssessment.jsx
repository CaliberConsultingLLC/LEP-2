// src/pages/SocietalNormAssessment.jsx
import React, { useEffect, useState } from "react";
import {
  Box, Container, Paper, Stack, Typography, Slider, Button, Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

const QUESTIONS = [
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
  "I am known among employees for one-line phrases like \"do what's right,\" \"challenges mean learning,\" or \"we're in this together.\"  (Perhaps, even jokes about it exist among employees.)",
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
  "Our company metrics are clearly and directly aimed at the mission and NOT just the bottom line",
  "I hand projects over to others and trust them to have equal or greater success than I would doing it myself.",
  "I know the limits of my natural strengths and that I need others to successfully achieve the height of the company's mission and vision."
];

export default function SocietalNormAssessment() {
  const navigate = useNavigate();
  const [responses, setResponses] = useState(() => Array(QUESTIONS.length).fill(5));
  const [saving, setSaving] = useState(false);
  const [openIntro, setOpenIntro] = useState(true);

  // Require session from intake
  useEffect(() => {
  let sid = localStorage.getItem("sessionId");
  if (!sid) {
    sid = `sess-${Date.now()}`;
    localStorage.setItem("sessionId", sid);
    console.log("Generated sessionId for norms:", sid);
  }
}, []);


  const setValue = (i, val) => {
    const next = [...responses];
    next[i] = val;
    setResponses(next);
  };

  const submit = async () => {
    setSaving(true);
    try {
      const sessionId = localStorage.getItem("sessionId");
      if (!sessionId) {
        navigate("/form");
        return;
      }
      await setDoc(doc(db, "societalNorms", sessionId), {
        responses,
        timestamp: new Date().toISOString()
      });
      navigate("/campaign-builder", { state: { norms: responses } });
    } catch (e) {
      console.error("Error saving norms:", e);
      setSaving(false);
    }
  };

  return (
    <Box
      sx={{
        p: 5,
        minHeight: '100vh',
        width: '100vw',
        backgroundImage:
          'linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), url(/LEP1.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative' }}>
        <Stack spacing={3} sx={{ width: '800px', mx: 'auto' }}>
          <Typography
            variant="h4"
            sx={{
              fontFamily: 'Gemunu Libre, sans-serif',
              color: 'text.primary',
              mb: 0.5,
              textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
            }}
          >
            Societal Norms Assessment
          </Typography>

          {/* Brief subtitle (short description + scale reminder) */}
          <Typography
            sx={{
              fontFamily: 'Gemunu Libre, sans-serif',
              color: 'text.secondary',
              fontSize: '1rem'
            }}
          >
            Rate how often each statement reflects your typical leadership behavior. Use the slider:
            1 = Never, 10 = Always.
          </Typography>

          {/* All questions on one page */}
          <Stack spacing={2}>
            {QUESTIONS.map((q, idx) => (
              <Paper
                key={idx}
                elevation={4}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(220,230,255,0.8))',
                  border: '1px solid',
                  borderColor: 'primary.main',
                  textAlign: 'left',
                  overflow: 'hidden' // prevents slider labels from spilling
                }}
              >
                <Typography
                  sx={{
                    fontFamily: 'Gemunu Libre, sans-serif',
                    fontSize: '1.05rem',
                    color: 'text.primary',
                    mb: 2,
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere'
                  }}
                >
                  {q}
                </Typography>

                <Slider
                  value={responses[idx]}
                  onChange={(_, v) => setValue(idx, v)}
                  step={1}
                  min={1}
                  max={10}
                  marks={[
                    { value: 1, label: "Never" },
                    { value: 10, label: "Always" }
                  ]}
                  valueLabelDisplay="on"
                  sx={{
                    mx: 1,
                    '& .MuiSlider-markLabel': {
                      fontSize: '0.75rem',
                      whiteSpace: 'nowrap',
                      transform: 'translateY(4px)'
                    },
                    '& .MuiSlider-valueLabel': {
                      fontSize: '0.75rem'
                    }
                  }}
                />
              </Paper>
            ))}
          </Stack>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={submit}
              disabled={saving}
              sx={{ fontFamily: 'Gemunu Libre, sans-serif', fontSize: '1rem', px: 5, py: 1.25 }}
            >
              {saving ? "Saving..." : "Submit Assessment"}
            </Button>
          </Box>
        </Stack>

        {/* Intro dialog */}
        <Dialog open={openIntro} onClose={() => setOpenIntro(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontFamily: 'Gemunu Libre, sans-serif' }}>
            About this assessment
          </DialogTitle>
          <DialogContent sx={{ fontFamily: 'Gemunu Libre, sans-serif' }}>
            This quick assessment helps reveal the norms and mindsets that may be shaping your leadership beneath the surface.
            By rating each statement, you’ll give the system context it uses to tailor your growth path.
            Scores are private and combined with your intake to build a more accurate campaign.
            Answer instinctively—there are no right or wrong responses.
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenIntro(false)} variant="contained">Got it</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
