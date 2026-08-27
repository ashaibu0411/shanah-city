import type { MinistryReportQuestion } from "@/lib/ministry-report-types";

export type MinistryReportPrefillOption = {
  id?: string;
  label: string;
  value: string;
};

/** Quick-pick counts for number fields. */
export const MINISTRY_REPORT_NUMBER_PRESETS: Record<string, number[]> = {
  newMembersCount: [0, 1, 2, 3, 4, 5],
  teamActivitiesCount: [0, 1, 2, 3, 4, 6, 8],
  activeVolunteers: [0, 2, 4, 6, 8, 10, 12, 15, 20],
  servicesLed: [0, 2, 4, 6, 8],
  rehearsalsHeld: [0, 1, 2, 3, 4],
  childrenServed: [0, 5, 10, 15, 20, 25, 30],
  newFamilies: [0, 1, 2, 3, 5],
  youthAttendance: [0, 5, 10, 15, 20, 25],
  newYouth: [0, 1, 2, 3, 5],
  gatheringsHeld: [0, 1, 2, 3, 4],
  averageAttendance: [0, 5, 10, 15, 20, 25, 30],
  newYoungAdults: [0, 1, 2, 3, 5],
  servicesCovered: [0, 2, 4, 6, 8],
  ushersOnRotation: [0, 4, 6, 8, 10, 12, 15],
  meetingsHeld: [0, 1, 2, 3, 4],
  membersEngaged: [0, 5, 10, 15, 20, 25, 30],
  membersCalled: [0, 5, 10, 15, 20, 30, 50],
  guestsContacted: [0, 3, 5, 10, 15, 20],
  returnVisitors: [0, 1, 2, 3, 5],
  prayerMeetingsHeld: [0, 1, 2, 3, 4],
  prayerRequestsHandled: [0, 5, 10, 15, 20, 30],
  intercessorsActive: [0, 3, 5, 8, 10, 12],
  weeksRecorded: [0, 1, 2, 3, 4, 5],
  contentPublished: [0, 1, 2, 3, 4, 6, 8],
};

const noneThisMonth = {
  label: "None this month",
  value: "None this month.",
};

const commonScenarios: Record<string, MinistryReportPrefillOption[]> = {
  membersSatOrLeft: [
    noneThisMonth,
    {
      label: "Schedule or family reasons",
      value:
        "One or more members stepped back temporarily due to work, school, or family schedule. Follow-up conversations are in progress.",
    },
    {
      label: "Healthy rotation",
      value:
        "Member(s) rotated off after a leader conversation for rest or reassignment. Transitions were handled with care.",
    },
    {
      label: "Needs pastoral support",
      value:
        "A sensitive transition is in progress. Details shared privately with pastoral staff — please follow up with me.",
    },
  ],
  teamActivities: [
    {
      label: "Weekly check-in",
      value:
        "Weekly team check-in (call, chat, or huddle) for prayer, updates, and coordination.",
    },
    {
      label: "Pre-service huddle",
      value:
        "Pre-service huddle with prayer, role review, and encouragement before each gathering.",
    },
    {
      label: "Team fellowship",
      value:
        "Team fellowship meal, outing, or social time to build unity and trust.",
    },
    {
      label: "Training session",
      value:
        "Volunteer training or skills workshop to prepare the team for upcoming ministry.",
    },
    {
      label: "No activities held",
      value:
        "No dedicated team activities this month. See shepherding gaps for context and support needed.",
    },
  ],
  shepherdingGaps: [
    {
      label: "None — team healthy",
      value:
        "No major gaps this month. Follow-up, unity, and shepherding happened consistently.",
    },
    {
      label: "Limited leader bandwidth",
      value:
        "Limited time due to work, travel, or personal season. Would appreciate a co-leader or admin support.",
    },
    {
      label: "Low team response",
      value:
        "Several outreach attempts had low response. Need help re-engaging members or clarifying expectations.",
    },
    {
      label: "Conflict being resolved",
      value:
        "A team misunderstanding or conflict is being addressed privately. Prayer and pastoral guidance welcome.",
    },
  ],
  attendanceEngagement: [
    {
      label: "Steady core team",
      value:
        "A steady core team served each week. Occasional absences were followed up within the week.",
    },
    {
      label: "Growing engagement",
      value:
        "Engagement is growing — more consistent attendance and new volunteers stepping in.",
    },
    {
      label: "Some members drifting",
      value:
        "A few members have been inconsistent. Personal follow-up is underway (see absent members).",
    },
    {
      label: "Low season",
      value:
        "Lower attendance this month due to holidays, travel, or school schedules. Rebuilding momentum next month.",
    },
  ],
  wins: [
    {
      label: "Strong team unity",
      value:
        "Strong team unity and servant hearts — volunteers showed up prepared and encouraged one another.",
    },
    {
      label: "New people served",
      value:
        "New guests, families, or volunteers connected and felt welcomed into the ministry.",
    },
    {
      label: "Smooth services",
      value:
        "Services or gatherings ran smoothly with good communication and fewer last-minute gaps.",
    },
    {
      label: "Salvation or growth",
      value:
        "Clear spiritual growth — salvations, recommitments, or deeper discipleship conversations.",
    },
    {
      label: "Problem solved",
      value:
        "Resolved a recurring issue (scheduling, equipment, communication) that had been a bottleneck.",
    },
  ],
  challenges: [
    {
      label: "Volunteer shortage",
      value:
        "Not enough volunteers on rotation for every service or event. Need more recruits or clearer scheduling.",
    },
    {
      label: "Scheduling conflicts",
      value:
        "Scheduling conflicts and last-minute drop-offs made coverage difficult this month.",
    },
    {
      label: "Training gap",
      value:
        "New volunteers need more training before serving independently.",
    },
    {
      label: "Equipment or space",
      value:
        "Equipment, room setup, or space limitations affected ministry quality.",
    },
    {
      label: "Communication breakdown",
      value:
        "Communication gaps between team members or with church leadership caused confusion.",
    },
    {
      label: "No major challenges",
      value: "No major challenges this month — ministry ran within normal expectations.",
    },
  ],
  prayerNeeds: [
    {
      label: "Team stamina",
      value: "Prayer for team stamina, joy, and protection from burnout.",
    },
    {
      label: "New volunteers",
      value: "Prayer for new volunteers to join and for existing members to stay engaged.",
    },
    {
      label: "Unity",
      value: "Prayer for unity, humility, and love across the team.",
    },
    {
      label: "Open doors",
      value: "Prayer for open doors to reach more people through this ministry.",
    },
    noneThisMonth,
  ],
  resourceNeeds: [
    noneThisMonth,
    {
      label: "More volunteers",
      value: "Need more volunteers on rotation to cover every service or gathering.",
    },
    {
      label: "Training materials",
      value: "Training materials, onboarding docs, or a team handbook would help.",
    },
    {
      label: "Equipment upgrade",
      value: "Equipment upgrade or replacement needed (see department notes).",
    },
    {
      label: "Budget or supplies",
      value: "Budget or supplies needed for upcoming events or weekly ministry.",
    },
    {
      label: "Co-leader support",
      value: "Would benefit from an assistant leader or co-leader to share shepherding load.",
    },
  ],
  upcomingEvents: [
    {
      label: "Continue regular rhythm",
      value:
        "Continue our regular ministry rhythm next month with improved follow-up and volunteer care.",
    },
    {
      label: "Special event planned",
      value:
        "Planning a special event or outreach — details and dates to be confirmed with leadership.",
    },
    {
      label: "Recruit and train",
      value:
        "Focus next month on recruiting new volunteers and running a training session.",
    },
    {
      label: "Team retreat or fellowship",
      value:
        "Team fellowship, retreat, or planning meeting to rebuild unity and vision.",
    },
  ],
  leaderHealth: [
    {
      label: "Doing well",
      value:
        "Doing well — staying connected with God, encouraged by the team, and manageable workload.",
    },
    {
      label: "Full but encouraged",
      value:
        "Full schedule but encouraged. Would appreciate prayer for wisdom and stamina.",
    },
    {
      label: "Need pastoral check-in",
      value:
        "Feeling stretched or isolated as a leader. Would appreciate a pastoral check-in.",
    },
    {
      label: "Need co-leader help",
      value:
        "Carrying most of the load alone. Would like help identifying a co-leader or assistant.",
    },
  ],
};

const templateScenarios: Record<string, MinistryReportPrefillOption[]> = {
  rehearsalAttendance: [
    {
      label: "Strong attendance",
      value:
        "Most musicians and vocalists attended rehearsals on time. Team arrived prepared.",
    },
    {
      label: "Mixed attendance",
      value:
        "Mixed attendance — core team present but some gaps due to work or travel. Covered with substitutes.",
    },
    {
      label: "Low attendance",
      value:
        "Lower rehearsal attendance this month. Following up individually and reviewing schedule expectations.",
    },
  ],
  musicianNeeds: [
    noneThisMonth,
    {
      label: "Need musicians",
      value: "Need additional musicians (keys, drums, bass, or guitar) on rotation.",
    },
    {
      label: "Need vocalists",
      value: "Need more vocalists or backup singers for full worship coverage.",
    },
    {
      label: "Need tech support",
      value: "Need sound, slides, or stream support to complement the worship team.",
    },
  ],
  curriculumProgress: [
    {
      label: "On track",
      value:
        "Lessons and materials prepared before each service. Teachers briefed and classrooms ready.",
    },
    {
      label: "Ahead of schedule",
      value:
        "Ahead of schedule — next month's lessons prepped and supplies stocked.",
    },
    {
      label: "Behind — catching up",
      value:
        "Fell behind on prep one week due to volunteer shortage. Catching up this week.",
    },
  ],
  safetyConcerns: [
    noneThisMonth,
    {
      label: "Check-in flow",
      value:
        "Minor check-in or pickup flow issue noted — corrected same day and team retrained.",
    },
    {
      label: "Classroom supervision",
      value:
        "Classroom needed extra supervision — adjusted volunteer ratios and communicated with parents.",
    },
    {
      label: "Escalation needed",
      value:
        "Safety concern requires pastoral review — details shared separately with leadership.",
    },
  ],
  volunteerGaps: [
    noneThisMonth,
    {
      label: "Sunday shortage",
      value:
        "Short on Sunday volunteers for one or more services — used floaters and asked leaders to cover.",
    },
    {
      label: "Holiday impact",
      value:
        "Holiday or travel season reduced available volunteers. Building backup list for next month.",
    },
    {
      label: "Need new recruits",
      value:
        "Need to recruit and train new volunteers — current rotation is stretched thin.",
    },
  ],
  discipleshipMoments: [
    {
      label: "Small group breakthrough",
      value:
        "Meaningful small group or one-on-one conversations about faith, identity, and obedience.",
    },
    {
      label: "Salvation or recommitment",
      value:
        "Teen(s) prayed for salvation or recommitment and were connected for follow-up.",
    },
    {
      label: "Mentorship growing",
      value:
        "Older teens mentoring younger students — healthy peer discipleship forming.",
    },
  ],
  parentEngagement: [
    {
      label: "Regular updates sent",
      value:
        "Regular parent updates sent (text, email, or announcement) about events and expectations.",
    },
    {
      label: "Parent meeting held",
      value:
        "Parent meeting or call held to align on calendar, safety, and discipleship goals.",
    },
    {
      label: "Need better parent comms",
      value:
        "Parent communication needs improvement — planning clearer channels next month.",
    },
    noneThisMonth,
  ],
  discipleshipHighlights: [
    {
      label: "Bible study depth",
      value:
        "Strong Bible study participation with honest sharing and prayer for one another.",
    },
    {
      label: "New connections",
      value:
        "New people connected through fellowship and are joining the discipleship rhythm.",
    },
    {
      label: "Accountability pairs",
      value:
        "Accountability or mentorship pairs meeting regularly for prayer and growth.",
    },
  ],
  communityOutreach: [
    {
      label: "Invite night planned",
      value: "Invite-a-friend night or social outreach planned for next month.",
    },
    {
      label: "Serving together",
      value: "Team serving together in the community or supporting another church ministry.",
    },
    {
      label: "Social fellowship",
      value: "Regular social fellowship (meal, game night, or outing) to build belonging.",
    },
    noneThisMonth,
  ],
  outreachPlans: [
    {
      label: "Invite event",
      value: "Planning an invite event or open gathering for new people next month.",
    },
    {
      label: "Partner with church-wide",
      value: "Aligning with a church-wide outreach or special service.",
    },
    {
      label: "Personal invites",
      value: "Encouraging each member to personally invite one person this month.",
    },
    noneThisMonth,
  ],
  guestWelcomeHighlights: [
    {
      label: "Warm guest welcome",
      value:
        "Guests consistently welcomed at the door, seated comfortably, and connected to follow-up.",
    },
    {
      label: "First-time guest care",
      value:
        "First-time guests received extra attention and were directed to connect or guest services.",
    },
    {
      label: "Congestion issue",
      value:
        "Door or seating congestion during peak arrival — adjusting team placement next service.",
    },
  ],
  trainingNeeds: [
    noneThisMonth,
    {
      label: "New usher onboarding",
      value: "Need onboarding session for new ushers on offering, communion, and emergency flow.",
    },
    {
      label: "Refresher training",
      value: "Team refresher training on guest welcome standards and service timing.",
    },
    {
      label: "Uniforms or badges",
      value: "Uniforms, badges, or printed role cards would help guests identify ushers.",
    },
  ],
  followUpFeedback: [
    {
      label: "Positive responses",
      value:
        "Most contacts were positive — guests appreciated the call and shared prayer requests.",
    },
    {
      label: "Mixed responses",
      value:
        "Mixed responses — some guests interested in returning, others not ready yet. Notes logged.",
    },
    {
      label: "Referrals to pastoral care",
      value:
        "Several calls surfaced pastoral or practical needs — referred to appropriate leaders.",
    },
  ],
  unreachableList: [
    noneThisMonth,
    {
      label: "No answer — retrying",
      value:
        "Some guests did not answer — second attempt planned via text or alternate number.",
    },
    {
      label: "Wrong contact info",
      value:
        "Wrong or missing contact info for a few records — working with guest services to update.",
    },
  ],
  pastoralEscalations: [
    noneThisMonth,
    {
      label: "Prayer or grief",
      value:
        "Guest or member needs pastoral prayer for grief, illness, or family crisis.",
    },
    {
      label: "Marriage or family",
      value:
        "Marriage or family situation needs sensitive pastoral follow-up.",
    },
    {
      label: "Salvation follow-up",
      value:
        "New believer or salvation decision needs discipleship connection urgently.",
    },
  ],
  breakthroughs: [
    {
      label: "Answered prayer",
      value:
        "Clear answered prayer shared in team meeting — team encouraged to keep interceding.",
    },
    {
      label: "Healing testimony",
      value:
        "Healing or provision testimony shared (with permission) that strengthened faith.",
    },
    noneThisMonth,
  ],
  discrepancies: [
    noneThisMonth,
    {
      label: "Minor count correction",
      value:
        "Minor count discrepancy found and corrected same week with second counter verification.",
    },
    {
      label: "Timing delay",
      value:
        "One count sheet submitted late due to volunteer availability — process reviewed with team.",
    },
  ],
  givingTrends: [
    {
      label: "Steady giving",
      value: "Giving counts steady compared to recent months — no unusual variance.",
    },
    {
      label: "Increase noted",
      value: "Noticeable increase in giving this month — likely tied to special offering or growth.",
    },
    {
      label: "Decrease noted",
      value:
        "Lower giving this month — may reflect attendance dip or seasonal pattern. Flagged for leadership.",
    },
  ],
  equipmentIssues: [
    noneThisMonth,
    {
      label: "Camera or stream",
      value: "Camera, stream, or encoding issue during service — workaround used, repair needed.",
    },
    {
      label: "Audio issue",
      value: "Audio or wireless issue affected stream or in-room experience — troubleshooting ongoing.",
    },
    {
      label: "Slides or software",
      value: "Slides or presentation software issue — backup plan used, need software update.",
    },
  ],
  volunteerTraining: [
    {
      label: "Cross-training done",
      value:
        "Cross-trained volunteers on backup roles (camera, slides, or stream) for smoother handoffs.",
    },
    {
      label: "New volunteer onboarded",
      value:
        "Onboarded new media volunteer with shadowing shifts before solo service.",
    },
    {
      label: "Need more training",
      value:
        "Need dedicated training session — several volunteers still uncomfortable on backup roles.",
    },
    noneThisMonth,
  ],
  careMoments: [
    noneThisMonth,
    {
      label: "Meals or rides",
      value:
        "Provided meals, rides, or practical help for women/men going through a hard season.",
    },
    {
      label: "Check-in calls",
      value:
        "Regular check-in calls or texts to members who were sick, grieving, or overwhelmed.",
    },
    {
      label: "Childcare support",
      value:
        "Coordinated childcare or schedule adjustments so mothers could attend gatherings.",
    },
  ],
  eventSafety: [
    noneThisMonth,
    {
      label: "Minor behavior issue",
      value:
        "Minor behavior issue addressed same day with parents notified — resolved peacefully.",
    },
    {
      label: "Needs leader follow-up",
      value:
        "Ongoing pastoral or safety concern being handled with parents and youth leaders.",
    },
  ],
};

const TEMPLATE_SCENARIOS: Record<string, Record<string, MinistryReportPrefillOption[]>> = {
  ladies: {
    discipleshipHighlights: [
      {
        label: "Strong Bible study",
        value:
          "Women engaged deeply in Bible study with honest sharing and prayer for one another.",
      },
      {
        label: "Prayer breakthrough",
        value:
          "Clear prayer breakthrough or encouragement shared in the group (details in notes if needed).",
      },
      {
        label: "New women connected",
        value:
          "New women attended and were personally welcomed — follow-up invites sent.",
      },
      {
        label: "Fellowship unity",
        value:
          "Fellowship meal or outing strengthened friendships and trust in the group.",
      },
    ],
    outreachPlans: [
      {
        label: "Invite-a-friend night",
        value: "Planning an invite-a-friend gathering or women's social next month.",
      },
      {
        label: "Church-wide event",
        value: "Aligning with a church-wide event to invite unconnected women.",
      },
      {
        label: "Personal invites",
        value: "Each core member inviting one woman who is not yet connected.",
      },
      noneThisMonth,
    ],
    wins: [
      {
        label: "Strong turnout",
        value: "Strong turnout and warm atmosphere at women's gatherings.",
      },
      {
        label: "New leaders emerging",
        value: "New helpers stepped up to host, pray, or coordinate fellowship.",
      },
      {
        label: "Life change",
        value: "Visible spiritual growth — deeper prayer, healing, or renewed commitment.",
      },
    ],
    resourceNeeds: [
      noneThisMonth,
      {
        label: "Childcare help",
        value: "Childcare or nursery support would help more mothers attend.",
      },
      {
        label: "Study materials",
        value: "Books, study guides, or craft/supplies needed for upcoming gatherings.",
      },
      {
        label: "Co-leader",
        value: "Would benefit from a co-leader to share planning and follow-up.",
      },
    ],
  },
  men: {
    discipleshipHighlights: [
      {
        label: "Accountability honesty",
        value:
          "Men opened up honestly in accountability — repentance, encouragement, and prayer.",
      },
      {
        label: "Leadership at home",
        value:
          "Conversations about leading families, marriage, and integrity in the workplace.",
      },
      {
        label: "New men joined",
        value: "New men attended brotherhood gathering and were connected for follow-up.",
      },
    ],
    outreachPlans: [
      {
        label: "Men's breakfast",
        value: "Planning a men's breakfast or outreach meal next month.",
      },
      {
        label: "Serve project",
        value: "Brotherhood serve project to invite unconnected men.",
      },
      noneThisMonth,
    ],
    wins: [
      {
        label: "Consistent attendance",
        value: "Consistent brotherhood attendance and transparent sharing.",
      },
      {
        label: "Men serving church",
        value: "More men stepping into service roles across the church.",
      },
    ],
  },
  teens: {
    discipleshipMoments: [
      {
        label: "Salvation or rededication",
        value:
          "Teen(s) prayed for salvation or rededication — connected for follow-up discipleship.",
      },
      {
        label: "Small group depth",
        value: "Honest small group conversations about faith, identity, and obedience.",
      },
      {
        label: "Peer mentorship",
        value: "Older teens mentoring younger students in the ministry.",
      },
    ],
    parentEngagement: [
      {
        label: "Updates sent",
        value: "Regular parent updates sent about events, expectations, and safety.",
      },
      {
        label: "Parent meeting",
        value: "Parent meeting held to align on calendar and discipleship goals.",
      },
      noneThisMonth,
    ],
  },
  youngAdults: {
    discipleshipHighlights: [
      {
        label: "Life-on-life mentorship",
        value:
          "Life-on-life mentorship happening outside Sunday — coffee, study, or accountability.",
      },
      {
        label: "Community forming",
        value: "New young adults finding belonging and joining the regular rhythm.",
      },
    ],
  },
  followUp: {
    wins: [
      {
        label: "Guests reached quickly",
        value: "Most first-time guests contacted within 48 hours of visit.",
      },
      {
        label: "Return visitors",
        value: "Several guests returned after personal follow-up calls.",
      },
    ],
  },
  finance: {
    wins: [
      {
        label: "On-time counts",
        value: "All weekly counts submitted on time with accurate reconciliation.",
      },
      {
        label: "Process improved",
        value: "Improved handoff or checklist reduced errors this month.",
      },
    ],
    challenges: [
      {
        label: "Counter shortage",
        value: "Not enough counters available every week — need more trained volunteers.",
      },
      noneThisMonth,
    ],
  },
  prayer: {
    wins: [
      {
        label: "Faithful coverage",
        value: "Prayer shifts and meetings covered faithfully all month.",
      },
      {
        label: "Answered prayer shared",
        value: "Answered prayer testimonies shared to encourage intercessors.",
      },
    ],
  },
  kids: {
    curriculumProgress: [
      {
        label: "On track",
        value:
          "Lessons and materials prepared before each service. Teachers briefed and classrooms ready.",
      },
      {
        label: "Ahead of schedule",
        value: "Next month's lessons prepped and classroom supplies stocked.",
      },
    ],
    wins: [
      {
        label: "Smooth check-in",
        value: "Check-in and pickup ran smoothly every service.",
      },
      {
        label: "New families",
        value: "New families enrolled and volunteers welcomed them warmly.",
      },
    ],
  },
  choir: {
    rehearsalAttendance: [
      {
        label: "Strong attendance",
        value:
          "Most musicians and vocalists attended rehearsals on time. Team arrived prepared.",
      },
      {
        label: "Mixed attendance",
        value:
          "Core team present but some gaps due to work or travel — covered with substitutes.",
      },
    ],
    wins: [
      {
        label: "Worship flowed well",
        value: "Worship flowed well with minimal last-minute changes.",
      },
      {
        label: "Team unity",
        value: "Strong team unity and servant attitudes during services.",
      },
    ],
  },
  ushering: {
    guestWelcomeHighlights: [
      {
        label: "Warm welcome",
        value:
          "Guests welcomed at the door, seated comfortably, and connected to follow-up.",
      },
      {
        label: "First-time care",
        value:
          "First-time guests received extra attention and direction to guest services.",
      },
    ],
  },
  media: {},
};

export function enrichReportQuestions(
  questions: MinistryReportQuestion[],
  templateKey?: string,
): MinistryReportQuestion[] {
  return questions.map((question) => {
    const numberPresets =
      question.numberPresets ??
      (question.type === "number" ? MINISTRY_REPORT_NUMBER_PRESETS[question.id] : undefined);

    const rawOptions =
      question.prefillOptions ??
      TEMPLATE_SCENARIOS[templateKey ?? ""]?.[question.id] ??
      templateScenarios[question.id] ??
      commonScenarios[question.id];

    const prefillOptions = rawOptions?.map((option, index) => ({
      ...option,
      id: option.id ?? `${question.id}-${index}`,
    }));

    return {
      ...question,
      ...(numberPresets?.length ? { numberPresets } : {}),
      ...(prefillOptions?.length ? { prefillOptions } : {}),
    };
  });
}
