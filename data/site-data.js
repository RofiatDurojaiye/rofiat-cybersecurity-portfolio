window.SITE_DATA = {
  "config": {
    "github": ""
  },
  "projects": [
    {
      "id": "cyber-threat-mapping",
      "title": "Cyber Threat Mapping",
      "category": "Incident Investigation",
      "status": "In Progress",
      "featured": true,
      "summary": "Mapping threat activity by its origin.",
      "problem": "",
      "tools": [],
      "image": "assets/img/moray.png",
      "repo": "",
      "sections": {},
      "screenshots": [
        {
          "src": "assets/img/moray.png",
          "caption": "Threat map workbook"
        }
      ]
    }
  ],
  "articles": [
    {
      "id": "triaging-an-alert-separating-evidence-from-assumption",
      "title": "Triaging an alert: separating evidence from assumption",
      "category": "SOC Operations",
      "tags": [
        "SOC",
        "Triage",
        "Investigation"
      ],
      "date": "2026-11-05",
      "summary": "A practical framework for deciding whether an alert is noise, a real incident, or something in between, and for documenting why.",
      "body": "An alert is not a conclusion. It is a prompt to ask a question: *did something actually happen, and does it matter?* The quality of a security operations team often shows in how it answers that question under time pressure. This article sets out a simple, repeatable way to approach it.\n\n## 1. Understand what fired, and why\n\nBefore looking at the affected system, look at the alert itself. What condition triggered it? Which log source produced it? Is the detection logic broad (it catches a lot, including harmless activity) or narrow (it fires only on specific behaviour)? An alert from a broad rule deserves more scepticism than one from a precise rule.\n\n## 2. Validate with independent data\n\nA single alert is a single data point. Look for corroboration in other sources: authentication logs, endpoint activity, network records, or earlier alerts involving the same user or host. If nothing else supports the alert, that is information too, but it is not proof that nothing happened, because logging can have gaps.\n\n## 3. Establish scope\n\nAsk three questions: *Which account or system is involved? What else did it touch? When did the activity start?* Building even a rough timeline turns a scattered set of events into a story, and gaps in the story show you where to look next.\n\n## 4. Keep three things apart\n\nThe most useful habit in investigation is separating:\n\n- **Evidence:** what the data actually shows (for example, a login from an unfamiliar location at a specific time).\n- **Assumptions:** what you believe but have not confirmed (for example, that the user was travelling).\n- **Conclusions:** what you decide based on the evidence, and how confident you are.\n\nWriting these down separately stops an assumption from quietly hardening into a \"fact\" that the next person relies on.\n\n## 5. Decide, then document\n\nEvery triage ends in a decision: close as benign, monitor, or escalate. Whichever you choose, record the reasoning in a way a colleague could follow without asking you. Good documentation shortens future investigations and makes it easier to tune noisy detections.\n\n## Reflection\n\nMy work in security operations has shaped how I see an alert: as the start of a question, not the answer. What draws me to this work is its practical side: understanding what happened, why it happened, how to investigate it, and what can be done to strengthen defences. Keeping evidence, assumptions and conclusions separate is a habit I value and keep working on, because it makes my reasoning easier for others to follow and to challenge.\n\nA calm, structured approach matters more than any single tool. The goal is not to be fast at closing alerts, but to be right about them and able to show why.",
      "related": []
    },
    {
      "id": "security-is-not-just-a-technical-problem",
      "title": "Security is not just a technical problem",
      "category": "Cybersecurity & Business",
      "tags": [
        "Risk",
        "Business",
        "Resilience"
      ],
      "date": "2026-11-05",
      "summary": "Why effective security depends on understanding risk, priorities and people, and not only on controls and alerts.",
      "body": "It is easy to describe security as a technical discipline: firewalls, detections, patches, access controls. Those matter. But they exist to serve something else, which is an organisation that needs to keep operating, protect its people and customers, and make sound decisions. When security loses sight of that, it tends to become either ignored or obstructive.\n\n## Security exists to protect something\n\nEvery control protects a process, a type of data, or a service the business relies on. Understanding that purpose changes how you prioritise. A vulnerability in a system that supports a critical process is not the same as the same vulnerability in an isolated test environment, even if a scanner scores them identically.\n\n## Risk is the shared language\n\nTechnical teams often speak in alerts and severities. Business leaders speak in impact, cost, and likelihood. Risk is the bridge between the two. Describing an issue as \"what could happen, how likely it is, and what it would affect\" makes it possible for non-technical decision-makers to weigh security against other priorities.\n\n## Controls have a cost\n\nEvery control adds friction, cost, or complexity. A control that people routinely work around may provide less protection than a simpler one they actually follow. Good security design accounts for how people really work, not only how a policy says they should.\n\n## Resilience, not just prevention\n\nNo organisation can prevent everything. Resilience means being able to detect problems early, respond in an organised way, and recover without losing what matters most. Thinking about resilience shifts the question from \"can we stop every attack?\" to \"how well can we continue and recover when something goes wrong?\"\n\n## Communication is a security skill\n\nAn accurate finding that nobody understands changes nothing. Being able to explain a technical issue plainly, state its business impact, and recommend a proportionate response is part of the job.\n\n## Reflection\n\nMy exposure to business and operational processes has strengthened my curiosity about how security can support efficiency, governance and risk management. It has shaped a belief I hold: security should not exist in isolation from the business it protects. I am still developing this perspective, and it is a big reason I keep learning on both the technical and the business side.\n\nTechnical depth and business understanding are not competing goals. The most useful security work combines both.",
      "related": []
    }
  ],
  "learning": [
    {
      "id": "cloud",
      "title": "Cloud Security",
      "label": "Currently exploring",
      "intro": "Understanding how cloud environments are secured and monitored.",
      "notes": []
    },
    {
      "id": "iam",
      "title": "Identity & Access Management",
      "label": "Currently exploring",
      "intro": "Understanding how identities and permissions are managed and governed.",
      "notes": []
    },
    {
      "id": "ai",
      "title": "AI Security",
      "label": "Interest",
      "intro": "Following the evolving relationship between AI, security and business.",
      "notes": []
    }
  ],
  "experience": [
    {
      "id": "soc-analyst",
      "role": "SOC Analyst",
      "org": "",
      "period": "",
      "details": "- Monitoring security alerts and triaging them to decide what is benign, what needs watching and what needs escalation\n- Investigating suspicious activity by reviewing logs and related events\n- Escalating confirmed or unclear incidents to the right team",
      "tools": [
        "SIEM",
        "EDR"
      ]
    }
  ]
};
