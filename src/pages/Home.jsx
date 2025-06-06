import React from 'react';
import { Container, Box, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

function Home() {
  const navigate = useNavigate();

  const defaultFormData = {
    teamSize: 7, // Middle manager likely manages a moderate-sized team
    leadershipExperience: 3, // 3 years in current role (Team Lead or similar)
    careerExperience: 8, // 8 years in leadership roles overall, showing experience
    industry: "Technology", // Unchanged, fits the profile
    role: "Team Lead", // Reflects middle management
    responsibilities: "My team oversees the development and deployment of software features, ensuring timely delivery and quality assurance.", // Reflects a middle manager’s scope
    resourcePick: "A mentor to guide your decision-making", // Lacks confidence, seeks guidance for tough decisions
    coffeeImpression: "They trust us to deliver.", // Emphasizes their strength in trusting the team
    projectApproach: "Distribute tasks to the team and set clear check-in points.", // Prefers delegation over direct involvement, reflecting trust in the team
    energyDrains: [
      "Mediating conflicts within the team", // Struggles with conflict management
      "Navigating frequent changes in priorities", // Prefers stability, indicating discomfort with tough decisions
      "Balancing expectations from high-pressure stakeholders" // Lacks confidence in managing upward pressure
    ],
    crisisResponse: [
      "I empower the team to take the lead while I support.", // Top choice, reflecting their strength in trusting the team
      "I focus on verifying details to ensure accuracy.", // Cautious approach, avoiding direct decision-making
      "I rally everyone to brainstorm solutions.", // Collaborative, but not leading decisively
      "I stay calm and provide clear direction.", // Lower priority, as they struggle with hard decisions
      "I take a hands-on role to address the issue quickly." // Least likely, avoids direct conflict or tough calls
    ],
    pushbackFeeling: "I feel anxious and second-guess my plan, hoping to avoid further conflict.", // Reflects lack of confidence and discomfort with conflict
    roleModelTrait: [
      "Making tough decisions without hesitation", // Wishes they could handle hard decisions better
      "Staying calm under pressure" // Desires more confidence in high-pressure situations
    ],
    successMetric: "Team members stepped up with their own ideas.", // Success is tied to team autonomy, aligning with their strength
    warningLabel: "Fragile: Avoid too much pushback.", // Reflects their struggle with conflict and lack of confidence
    leaderFuel: [
      "Seeing the team gel and succeed together", // Top energizer, reflecting their strength
      "Hearing the team say they learned something",
      "My team getting the recognition it deserves",
      "Turning chaos into order",
      "Nailing a tough project on time",
      "Solving a problem no one else could" // Least energizing, as it requires confidence they lack
    ],
    proudMoment: "I felt proud when my team independently resolved a major client issue, showing their growth and capability.", // Highlights their trust in the team
    selfReflection: "I need to work on being more decisive and managing conflicts confidently.", // Directly addresses their weaknesses
    selectedAgent: "highSchoolCoach" // Seeks a supportive coach to boost confidence
  };

  const handleDevSkip = async () => {
    try {
      await addDoc(collection(db, 'responses'), {
        ...defaultFormData,
        timestamp: new Date(),
      });
      console.log('Default form data submitted successfully!');
      navigate('/summary');
    } catch (error) {
      console.error('Error submitting default form data:', error);
    }
  };

  const handleGetStarted = () => {
    console.log('Get Started button clicked, navigating to /campaign-intro');
    navigate('/form');
  };

  return (
    <Box
      sx={{
        bgcolor: 'white',
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container sx={{ textAlign: 'center' }}>
        <Box sx={{ mb: 6 }}>
          <img src="/logo.jpg" alt="LEP Logo" style={{ width: '600px', height: 'auto' }} />
        </Box>
        <Stack spacing={2} direction="column" alignItems="center">
          <Button
            variant="contained"
            color="primary"
            onClick={handleGetStarted}
            sx={{
              fontSize: '1.125rem',
              px: 4,
              py: 2,
              bgcolor: '#457089',
              '&:hover': { bgcolor: '#375d78' },
            }}
          >
            Get Started
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleDevSkip}
            sx={{
              fontSize: '1.125rem',
              px: 4,
              py: 2,
            }}
          >
            Dev Skip
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}

export default Home;