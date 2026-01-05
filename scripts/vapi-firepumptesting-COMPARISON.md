# Vapi Configuration Comparison

This document compares the Fire Pump Testing Company configuration with existing configurations in the workspace.

## Configuration Overview

| Feature | CAPCo Fire | Barry Law | Fire Pump Testing |
|---------|-----------|-----------|-------------------|
| **Company Type** | Fire Protection Documents | Bankruptcy Law | Fire Protection Services |
| **Assistant Name** | Kylie/Lily | Kylie | Sarah |
| **Voice ID** | Kylie | Kylie | Sarah |
| **Primary Service** | Document Preparation | Legal Consultation | Testing & Installation |
| **Business Model** | B2B Fire Protection | Consumer Legal Services | B2B/B2C Fire Services |
| **Special Status** | - | - | Veteran-Owned (SDVOSB) |

## Service Comparison

### CAPCo Fire Protection
**Services:**
- Fire sprinkler document preparation
- Fire alarm legal documents
- Code compliance consultations
- Design services

**Consultation Types:**
- Fire Sprinkler Consultation (30-60 min)
- Fire Alarm Consultation (30-60 min)
- Code Review (30-45 min)
- General Fire Protection (45-60 min)

**Key Focus:** Document preparation and design

### Barry Law Firm
**Services:**
- Personal bankruptcy (Chapter 7, 13)
- Business bankruptcy (Chapter 11)
- Tax relief
- Foreclosure defense
- Wage garnishment protection

**Consultation Types:**
- Personal Bankruptcy (30-45 min)
- Tax Relief (30-45 min)
- Foreclosure (30-45 min)
- Wage Garnishment (30 min)
- General Financial (45 min)

**Key Focus:** Legal consultation and representation

### Fire Pump Testing Company
**Services:**
- Fire pump testing (annual, weekly, monthly)
- Fire sprinkler installation
- Annual inspections
- System testing
- Maintenance & repairs
- 24/7 emergency service

**Service Types:**
- Installation (1-5 days)
- Inspection (1-3 hours)
- Testing (2-4 hours)
- Maintenance (1-4 hours)
- Fire Pump Services (2-3 hours)

**Key Focus:** Hands-on testing, installation, and maintenance

## Voice Assistant Persona Comparison

### CAPCo - Kylie/Lily
- **Personality**: Friendly, organized, efficient
- **Tone**: Warm but business-focused
- **Expertise**: Fire protection design and documentation
- **Greeting**: "Thank you for calling CAPCo Fire Protection..."

### Barry Law - Kylie
- **Personality**: Friendly, organized, empathetic
- **Tone**: Compassionate and professional
- **Expertise**: Financial legal matters
- **Greeting**: "Thank you for calling [Law Firm]..."
- **Special Note**: Emphasizes 45 years of experience

### Fire Pump Testing - Sarah
- **Personality**: Professional, reliable, safety-focused
- **Tone**: Friendly but business-oriented
- **Expertise**: Fire protection systems and testing
- **Greeting**: "Thank you for calling Fire Pump Testing Company, Massachusetts' trusted fire protection partner..."
- **Special Note**: Emphasizes veteran-owned status

## Technical Configuration Comparison

### Shared Features (All Three)
```javascript
// Model Configuration
model: {
  provider: "anthropic",
  model: "claude-3-5-sonnet-20241022",
  temperature: 0.7,
  maxTokens: 1000,
}

// Call Settings
maxDurationSeconds: 300,
backgroundSound: "office",
silenceTimeoutSeconds: 15,

// Tools Used
toolIds: [
  "0b17d3bc-a697-432b-8386-7ed1235fd111", // getStaffSchedule
  "5b8ac059-9bbe-4a27-985d-70df87f9490d", // bookAppointment
]
```

### Unique Configuration Elements

#### CAPCo Fire Protection
```javascript
// Username parameter
getStaffSchedule({ username: 'capco' })
bookAppointment({ username: 'capco', ... })

// Preparation phrase
"If you can gather your project documents in advance that will help to expedite services."
```

#### Barry Law Firm
```javascript
// Uses getAccountInfo() instead of getStaffSchedule()
getAccountInfo()

// Preparation phrase
"If you can gather your financial documents in advance, that will help Attorney Levine provide you with the best advice."

// Emphasizes attorney credentials
"Attorney Barry R. Levine has been helping people get debt-free for 45 years."
```

#### Fire Pump Testing Company
```javascript
// Standard getAccountInfo()
getAccountInfo()

// Preparation phrase
"Please ensure our technicians have access to the fire protection equipment and any relevant system documentation. If you can have your previous inspection reports available, that will help our certified technicians provide the best service."

// Emphasizes veteran status
"As a Service-Disabled Veteran Owned Small Business..."
```

## Conversation Flow Differences

### Time Selection Process

**CAPCo & Fire Pump Testing:**
1. Present available times FIRST
2. Wait for selection
3. Confirm time
4. Collect information
5. Book appointment

**Barry Law:**
1. Call getAccountInfo() immediately when call starts
2. Present available times
3. Wait for explicit selection
4. Confirm time
5. Collect information
6. Book appointment

### Emergency Handling

**CAPCo:**
- Mentions same-day availability
- No specific emergency protocol

**Barry Law:**
- Assesses urgency (foreclosure, garnishment)
- Prioritizes urgent matters
- No 24/7 emergency service

**Fire Pump Testing:**
- **Dedicated emergency route**
- Recognizes emergency keywords
- Mentions 24/7 availability
- Promises 15-minute callback
- Escalates to emergency team

## NFPA Standards Knowledge

### CAPCo Fire Protection
- NFPA 13 (sprinkler systems)
- NFPA 72 (fire alarm systems)
- General code compliance

### Fire Pump Testing Company
- NFPA 13, 13R, 13D (sprinkler systems)
- NFPA 17, 17A (extinguishing systems)
- NFPA 20 (fire pumps)
- NFPA 25 (inspection/testing/maintenance)
- NFPA 72 (fire alarm systems)

**Fire Pump Testing has more comprehensive NFPA knowledge**

## Building Types Served

### CAPCo
- Residential
- Commercial
- Mercantile
- Storage/Warehouse
- Institutional
- Mixed-use

### Fire Pump Testing
- Residential (more detailed subcategories)
- Commercial (more detailed subcategories)
- Industrial (added category)
- Institutional
- Mixed-use

**Fire Pump Testing includes Industrial category**

## Preparation Requirements

### CAPCo (Document-Focused)
- Building plans
- Site address
- Project timeline
- Occupancy type
- Current system documentation

### Barry Law (Financial-Focused)
- Pay stubs
- Bank statements
- Tax returns
- Collection notices
- Court documents
- Debt information

### Fire Pump Testing (Service-Focused)
- Building plans (for installation)
- System documentation
- Previous inspection reports
- Service history
- Access to equipment

## Key Differentiators

### CAPCo Fire Protection
✅ Focus on design and documentation
✅ Shorter consultation times
✅ B2B oriented
✅ Design expertise emphasis

### Barry Law Firm
✅ Empathetic approach for stressed clients
✅ 45 years experience emphasis
✅ Multiple bankruptcy chapters
✅ Financial legal expertise
✅ Consumer-focused

### Fire Pump Testing Company
✅ 24/7 emergency service
✅ Veteran-owned emphasis
✅ Hands-on technical services
✅ Most comprehensive NFPA knowledge
✅ Installation + testing + maintenance
✅ Longer service durations
✅ Industrial facilities included

## Recommended Use Cases

### Use CAPCo Config When:
- Client needs design services
- Focus is on documentation
- Short consultations needed
- B2B fire protection documents

### Use Barry Law Config When:
- Client needs legal services
- Empathetic approach required
- Financial stress situations
- Consumer legal matters

### Use Fire Pump Testing Config When:
- Client needs hands-on services
- 24/7 emergency service required
- Installation/testing/maintenance needed
- Veteran-owned status is important
- Industrial facilities involved
- Comprehensive NFPA compliance needed

## Migration Guide

### From CAPCo to Fire Pump Testing
1. Change assistant name from Kylie/Lily to Sarah
2. Update service types (add installation, testing, maintenance)
3. Add emergency service route
4. Update NFPA standards list
5. Add industrial building category
6. Update preparation requirements
7. Change preparation phrase
8. Add veteran-owned messaging

### From Barry Law to Fire Pump Testing
1. Change from legal to fire protection services
2. Change assistant name from Kylie to Sarah
3. Replace financial consultation types with fire protection services
4. Remove empathy/stress language
5. Add technical fire protection terminology
6. Add NFPA standards knowledge
7. Add 24/7 emergency service
8. Change preparation requirements
9. Add veteran-owned messaging

## Conclusion

All three configurations share the same core architecture and tools but are customized for their specific industries:

- **CAPCo**: Design & documentation specialist
- **Barry Law**: Legal consultation specialist
- **Fire Pump Testing**: Hands-on service specialist

The Fire Pump Testing configuration is the most comprehensive in terms of:
- Service variety (installation + testing + maintenance)
- Emergency handling (24/7 availability)
- NFPA standards coverage
- Building type categories
- Service duration ranges

Choose the configuration that best matches your business model and adapt as needed.






