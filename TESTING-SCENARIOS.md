# EasyTrip Phase 2 - Testing Scenarios & Checklist

## Smoke Test Procedures

### Scenario 1: App Startup & Splash Screen ✅

**Procedure:**
1. Run `npm start` (Metro bundler verified ✅)
2. Select platform: iOS Simulator / Android Emulator / Expo Go (physical device)
3. Wait for app to load

**Expected Results:**
- [x] Metro bundler starts without errors
- [ ] Splash screen displays (requires device/emulator)
- [ ] App does not crash on startup
- [ ] Fonts load without freezing
- [ ] StatusBar displays correctly

**Blockers:** None  
**Status:** Ready for device testing

---

### Scenario 2: Navigation & Tab Switching

**Procedure:**
1. After app loads, verify bottom tab navigation visible
2. Tap each tab: Home, Search, Create Trip, Itinerary, Settings
3. Verify no crashes or blank screens

**Expected Results:**
- [x] Navigation component renders
- [ ] Tab buttons are tappable
- [ ] Tab transitions are smooth
- [ ] Each screen loads without errors
- [ ] Back navigation works

**Components to Test:**
- `BottomTabNavigator` (pill design)
- `TopHeaderNav` (no overflow)
- `RootNavigator` (stack structure)

**Blockers:** None  
**Status:** Ready for device testing

---

### Scenario 3: Theme Switching

**Procedure:**
1. Navigate to Settings tab
2. Toggle theme switch (light/dark)
3. Verify theme changes immediately across all tabs
4. Return to other screens and verify theme consistency

**Expected Results:**
- [x] Theme provider is configured
- [ ] Toggle works without flicker
- [ ] All components respect theme
- [ ] Colors update instantly
- [ ] No console errors on toggle

**Components to Test:**
- `ThemeProvider` (context)
- Theme consumer components
- Color consistency across app

**Blockers:** Theme toggle must be functional  
**Status:** Ready for device testing

---

### Scenario 4: Font Loading

**Procedure:**
1. Observe app startup
2. Verify all text displays in correct fonts (Fredoka, Nunito)
3. Check font loading does not cause layout shift
4. Verify no "flash of unstyled text" (FOUT)

**Expected Results:**
- [x] Fonts configured in `useAppFonts()`
- [x] Fonts preload before app render
- [ ] Text renders in correct font families
- [ ] No layout shift during font load
- [ ] Performance impact minimal

**Fonts Expected:**
- Fredoka (headers, display)
- Nunito (body text)
- System font (fallback)

**Blockers:** None  
**Status:** Ready for device testing

---

### Scenario 5: Authentication Flow (Mocked)

**Procedure:**
1. Navigate to Sign-In screen
2. Verify auth options display:
   - Apple Sign-In (iOS only)
   - Google Sign-In
   - Email/OTP
3. Select one option (skip actual auth for now)
4. Verify error handling (mock failures)

**Expected Results:**
- [x] Sign-In screen component exists
- [ ] Auth buttons render correctly
- [ ] Platform-specific options show (Apple on iOS)
- [ ] Form validation works
- [ ] Error messages display on failure

**Mock Endpoints Needed:**
- POST `/auth/apple` → `{ jwt, user }`
- POST `/auth/google` → `{ jwt, user }`
- POST `/auth/otp` → `{ jwt, user }`

**Blockers:** Mock service not yet implemented  
**Status:** Blocked - awaiting mock auth service

---

### Scenario 6: Consent Screen

**Procedure:**
1. Navigate to Consent/Privacy settings
2. Verify toggle switches render
3. Toggle each consent option (analytics, marketing, etc.)
4. Verify state persists (check MMKV storage)

**Expected Results:**
- [x] ConsentScreen component exists
- [ ] Toggle switches are functional
- [ ] State changes are saved
- [ ] No console errors on toggle
- [ ] Data persists across app restarts

**Storage Technology:** MMKV (react-native-mmkv)

**Blockers:** None  
**Status:** Ready for device testing

---

### Scenario 7: Trip Creation Flow

**Procedure:**
1. Navigate to Create Trip tab
2. Verify form fields render:
   - Trip name input
   - Date range picker
   - Destination search
   - Budget input
3. Attempt to submit (with mock validation)

**Expected Results:**
- [x] TripCreatorScreen component exists
- [ ] Form fields render and accept input
- [ ] Date picker opens and responds
- [ ] Input validation works
- [ ] Submit button responds to taps

**Components to Test:**
- `TripCreatorScreen`
- `TextInput` atoms
- Date picker integration

**Blockers:** None (validation can be mocked)  
**Status:** Ready for device testing

---

### Scenario 8: Itinerary Navigation (Swipe)

**Procedure:**
1. Navigate to Itinerary tab (or open existing trip)
2. Verify daily plan cards display
3. Swipe left/right to navigate between days
4. Verify smooth transitions

**Expected Results:**
- [x] ItineraryOverviewScreen loads
- [ ] Daily plan cards visible
- [ ] Swipe gestures recognized
- [ ] Transitions are smooth (reanimated)
- [ ] No crashes on swipe

**Gesture Libraries:** 
- `react-native-gesture-handler`
- `react-native-reanimated` v3.10.1

**Blockers:** None  
**Status:** Ready for device testing

---

### Scenario 9: Place Details Sheet

**Procedure:**
1. Tap on a task/place in daily planner
2. Verify bottom sheet slides up
3. Display place details (name, time, location)
4. Verify close gesture (swipe down) works

**Expected Results:**
- [ ] Place detail sheet appears
- [ ] Smooth slide-up animation
- [ ] Details render correctly
- [ ] Swipe-down close works
- [ ] No overlays or layout issues

**Components to Test:**
- `PlaceDetailSheet`
- Bottom sheet modal (react-native-modal or custom)

**Blockers:** None  
**Status:** Ready for device testing

---

### Scenario 10: Maps Integration (Basic)

**Procedure:**
1. Open a location/place detail
2. Verify map displays
3. Zoom in/out (if interactive)
4. Verify markers appear for venues

**Expected Results:**
- [ ] Map renders without crashing
- [ ] Initial coordinates display
- [ ] Markers visible for venues
- [ ] Zoom/pan responsive

**Package:** `react-native-maps` v1.14.0

**Note:** Requires device or emulator with Google Play Services

**Blockers:** Maps setup required  
**Status:** Needs configuration

---

## Summary of Test Readiness

| Scenario | Status | Blocker | Notes |
|----------|--------|---------|-------|
| 1. Startup | ✅ Ready | None | Metro bundler confirmed working |
| 2. Navigation | ✅ Ready | None | Components exist in navigation |
| 3. Theme | ✅ Ready | None | Theme provider configured |
| 4. Fonts | ✅ Ready | None | Fonts preload before render |
| 5. Auth Flow | ⏳ Blocked | Mock service | Needs mock endpoints |
| 6. Consent | ✅ Ready | None | MMKV storage configured |
| 7. Trip Creation | ✅ Ready | None | Form components exist |
| 8. Itinerary Swipe | ✅ Ready | None | Reanimated v3 installed |
| 9. Place Details | ✅ Ready | None | Modal component exists |
| 10. Maps | ⏳ Blocked | Config | Needs setup for emulator |

---

## Test Execution Order

### Phase 1 (Frontend Only - No Backend):
1. ✅ App Startup
2. ✅ Navigation
3. ✅ Theme Switching
4. ✅ Font Loading
5. ✅ Consent Screen
6. ✅ Trip Creation (form validation)
7. ✅ Itinerary Swipe
8. ✅ Place Details Sheet

### Phase 2 (With Mock Backend):
9. ⏳ Auth Flow (mock endpoints)
10. ⏳ Maps Integration

---

## Success Criteria

**Phase 2 Smoke Test PASS when:**
- ✅ App starts without crashes
- ✅ All primary navigation paths work
- ✅ Theme switching is flicker-free
- ✅ Fonts load without FOUT
- ✅ Form inputs accept data
- ✅ Gesture animations are smooth
- ✅ 0 critical runtime errors
- ✅ Console warnings minimal

**Phase 2 Smoke Test FAIL if:**
- ❌ App crashes on startup
- ❌ Navigation broken (tabs unreachable)
- ❌ Fonts cause layout shift
- ❌ Critical console errors
- ❌ Unhandled exceptions in navigation

---

## Notes for QA & Testing Team

1. **Device Recommendation:** Test on both iOS (if available) and Android emulator for comprehensive coverage
2. **Network:** Most tests can run offline; auth flow requires mock service
3. **Performance:** Monitor startup time, frame rate during animations, memory usage
4. **Gesture Testing:** Ensure smooth swipe/pan interactions (critical for UX)
5. **Accessibility:** Verify text scaling, touch targets, semantic HTML structure

---

**Generated:** 2026-04-26  
**Version:** Phase 2 Baseline  
**Next Update:** After device smoke test execution
