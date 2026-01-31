# VAPI Security: Physical Access Protection Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     SECURITY SCENARIO                           │
│                                                                  │
│  You're logged in and working...                                │
│  Someone needs to talk to you...                                │
│  You walk away from your computer...                            │
│  🚶 "Be right back!"                                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   WITHOUT PROTECTION ❌                          │
└─────────────────────────────────────────────────────────────────┘
    │
    ├─→ Attacker clicks "Start Voice Assistant"
    │   ✅ Works immediately (no verification)
    │
    ├─→ Attacker says "Create new project"
    │   ✅ Works (no authentication)
    │
    ├─→ Attacker creates fake projects
    │   ✅ All appear to be from you
    │
    └─→ Attacker accesses your data
        ✅ Full access (you're logged in)

┌─────────────────────────────────────────────────────────────────┐
│                    WITH PROTECTION ✅                            │
└─────────────────────────────────────────────────────────────────┘

SCENARIO 1: Voice Assistant Not Running
────────────────────────────────────────
    │
    ├─→ Attacker clicks "Start Voice Assistant"
    │   ⬇️
    │   ┌──────────────────────────────────────┐
    │   │  🔒 Password Modal Appears           │
    │   │  "Verify Your Identity"              │
    │   │  [Password: _____________]           │
    │   │  [Cancel] [Verify & Start]           │
    │   └──────────────────────────────────────┘
    │   ⬇️
    ├─→ Attacker doesn't know password
    │   ❌ Can't start voice assistant
    │   ❌ Can't proceed
    │
    └─→ 🎉 Your system is protected!

SCENARIO 2: Voice Assistant Running (You Forgot to Stop)
─────────────────────────────────────────────────────────
    │
    ├─→ Attacker finds voice assistant active
    │   ⏰ Timer: 3 minutes since last activity
    │   ⬇️
    ├─→ Attacker tries to use it
    │   ⏰ Timer: 4 minutes...
    │   ⏰ Timer: 5 minutes...
    │   ⬇️
    │   ┌──────────────────────────────────────┐
    │   │  ⚠️ Auto-Timeout Triggered           │
    │   │  "Voice assistant stopped due to     │
    │   │   inactivity (5 minutes)"            │
    │   │  Status: Disconnected                │
    │   └──────────────────────────────────────┘
    │   ⬇️
    ├─→ Attacker tries to restart
    │   ⬇️
    │   ┌──────────────────────────────────────┐
    │   │  🔒 Password Modal Appears           │
    │   │  (Same as Scenario 1)                │
    │   └──────────────────────────────────────┘
    │   ⬇️
    └─→ ❌ Can't proceed without password
        🎉 Your system is protected!

SCENARIO 3: You Return Within 5 Minutes
────────────────────────────────────────
    │
    ├─→ You return to your computer
    │   ⏰ Timer: 2 minutes elapsed
    │   ⬇️
    ├─→ Voice assistant still active
    │   ✅ You can continue working
    │   ✅ No need to re-authenticate
    │   ⬇️
    └─→ You say something
        ⏰ Timer resets to 0
        ✅ Session continues normally
```

## Security Feature Matrix

| Action                           | Before Enhancement      | After Enhancement         |
| -------------------------------- | ----------------------- | ------------------------- |
| Start assistant while logged in  | ⚠️ Immediate start      | ✅ Password required      |
| Walk away with assistant running | ❌ Stays active forever | ✅ Auto-stops after 5 min |
| Attacker tries to use            | ❌ Works                | ✅ Blocked by password    |
| Attacker tries to restart        | ⚠️ Works if logged in   | ✅ Blocked by password    |
| Forgotten to stop assistant      | ❌ Wastes credits       | ✅ Auto-stops             |
| Resume work within timeout       | ➖ N/A                  | ✅ Seamless (no re-auth)  |

## Activity Detection Logic

```
User Activity → Resets Timer
├─ User speaks
├─ Assistant responds
├─ File upload
└─ Any VAPI interaction

No Activity → Timer Counts Down
├─ 0 min: ✅ Active
├─ 1 min: ✅ Active
├─ 2 min: ✅ Active
├─ 3 min: ✅ Active
├─ 4 min: ✅ Active
├─ 5 min: ⚠️ AUTO-STOP TRIGGERED
└─ "Voice assistant stopped due to inactivity"
```

## Password Verification Flow

```
┌──────────────────────────────────────────────────────────┐
│  User clicks "Start Voice Assistant"                     │
└───────────────────┬──────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────────┐
│  Modal: "Verify Your Identity"                           │
│  [Password: ••••••••]                                    │
└───────────────────┬──────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────────┐
│  POST /api/auth/verify-password                          │
│  { password: "user_input" }                              │
└───────────────────┬──────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────────┐
│  Supabase Auth: signInWithPassword()                     │
│  • Uses current user's email from session                │
│  • Verifies password against Supabase                    │
└───────────────────┬──────────────────────────────────────┘
                    ↓
         ┌──────────┴──────────┐
         ↓                      ↓
┌──────────────────┐   ┌──────────────────┐
│ ✅ Correct       │   │ ❌ Incorrect     │
│ Password         │   │ Password         │
└────────┬─────────┘   └────────┬─────────┘
         ↓                       ↓
┌──────────────────┐   ┌──────────────────┐
│ Modal closes     │   │ Show error       │
│ VAPI starts      │   │ Stay on modal    │
│ Timer starts     │   │ Try again        │
└──────────────────┘   └──────────────────┘
```

## Timeline: Normal Usage

```
Time    Event                           Security Status
──────────────────────────────────────────────────────────
0:00    User logs in to system         ✅ Session auth
0:05    Opens /voice-assistant-vapi    ✅ Page auth
0:06    Clicks "Start"                 🔒 Password prompt
0:07    Enters password                🔒 Verifying...
0:08    Password correct               ✅ VAPI starts
        Timer: 0 min                   ⏰ Timeout armed
1:30    User speaks: "Create project"  ⏰ Timer reset
2:45    Assistant responds             ⏰ Timer reset
5:00    User working on something else ⏰ Timer counting
7:00    User says another command      ⏰ Timer reset
10:00   User clicks "Stop"             ✅ Session ends
                                       ⏰ Timer cleared
```

## Timeline: Attack Scenario

```
Time    Event                           Security Status
──────────────────────────────────────────────────────────
0:00    User logs in, works normally   ✅ Legitimate use
0:30    User walks away                ⚠️ Computer unlocked
0:31    Attacker approaches            🚨 Physical access
0:32    Attacker clicks "Start Voice"  🔒 Password modal!
0:33    Attacker: "Uh... what?"        ❌ Blocked
0:34    Attacker tries random password ❌ Incorrect
0:35    Attacker gives up              ✅ Attack failed
                                       🎉 System protected
```

## Timeline: Forgotten Session

```
Time    Event                           Security Status
──────────────────────────────────────────────────────────
0:00    User starts voice assistant    ✅ Working
0:05    User: "Create project"         ✅ Working
0:10    User gets distracted           ⚠️ Still active
0:15    User walks away                ⚠️ Still active
0:20    [No activity]                  ⏰ 5 min timeout!
0:20    AUTO-STOP triggered            ✅ Protected
0:25    Attacker tries to use          🔒 Needs password
                                       ✅ Attack failed
```

## Key Takeaways

1. 🔐 **Password required EVERY TIME** you start
2. ⏱️ **Auto-stops after 5 minutes** of inactivity
3. ✅ **Protects even if you forget** to stop it
4. ✅ **No one can use it** without your password
5. 🆓 **Zero additional cost**

## What to Tell Users

> "You'll need to enter your password each time you start the voice assistant.
> This protects your account if you step away from your computer.
> The assistant will also automatically stop after 5 minutes of inactivity."

## Quick Test

1. Start voice assistant (enter password) ✅
2. Walk away for 6 minutes
3. Come back
4. Try to use voice assistant
5. Expected: It has stopped, you need to re-enter password

**If this works, your security is properly configured! 🎉**
