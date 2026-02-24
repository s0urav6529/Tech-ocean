/**
 * OTP Logic Smoke Test (no Redis, no HTTP)
 * Tests: generation, hashing, bcrypt comparison, format validation
 * Run with: node src/tests/otp.logic.test.js
 */

import bcrypt from 'bcryptjs';

// ── Inline the pure functions under test ────────────────────────────────────
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const hashOTP = (otp) => bcrypt.hash(otp, 10);

// ── Simple test runner ───────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

const assert = (label, condition, detail = '') => {
    if (condition) {
        console.log(`  ✅  ${label}`);
        passed++;
    } else {
        console.error(`  ❌  ${label}${detail ? ' — ' + detail : ''}`);
        failed++;
    }
};

// ── Tests ────────────────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════════');
console.log('  Redis OTP  —  Logic Smoke Tests');
console.log('══════════════════════════════════════════\n');

console.log('▸ OTP Generation');
{
    const otp = generateOTP();
    assert('OTP is a string', typeof otp === 'string');
    assert('OTP is exactly 6 chars', otp.length === 6, `got: ${otp.length}`);
    assert('OTP is all digits', /^\d{6}$/.test(otp), `got: ${otp}`);
    assert('OTP >= 100000', parseInt(otp) >= 100000, `got: ${otp}`);
    assert('OTP <= 999999', parseInt(otp) <= 999999, `got: ${otp}`);
}

console.log('\n▸ OTP Uniqueness (20 samples)');
{
    const otps = new Set(Array.from({ length: 20 }, () => generateOTP()));
    assert('Generated OTPs have high uniqueness (>= 15/20)', otps.size >= 15, `unique: ${otps.size}/20`);
}

console.log('\n▸ OTP Hashing & Verification');
{
    const otp = generateOTP();
    const hash = await hashOTP(otp);
    const isMatch = await bcrypt.compare(otp, hash);
    const isWrong = await bcrypt.compare('000000', hash);

    assert('bcrypt hash is produced', typeof hash === 'string' && hash.startsWith('$2'));
    assert('correct OTP matches hash', isMatch);
    assert('wrong OTP does NOT match hash', !isWrong);
    assert('hash length is reasonable (>= 60)', hash.length >= 60, `len: ${hash.length}`);
}

console.log('\n▸ Rate Limiting Counter Logic (pure)');
{
    // Simulate the INCR + window logic in-memory
    const limits = {};
    const MAX = 3;

    const checkLimit = (contact) => {
        limits[contact] = (limits[contact] ?? 0) + 1;
        return { allowed: limits[contact] <= MAX, count: limits[contact] };
    };

    const r1 = checkLimit('test');
    const r2 = checkLimit('test');
    const r3 = checkLimit('test');
    const r4 = checkLimit('test');   // Should be blocked

    assert('1st request allowed  (count=1)', r1.allowed && r1.count === 1);
    assert('2nd request allowed  (count=2)', r2.allowed && r2.count === 2);
    assert('3rd request allowed  (count=3)', r3.allowed && r3.count === 3);
    assert('4th request blocked  (count=4)', !r4.allowed && r4.count === 4);
}

console.log('\n▸ Contact Validation');
{
    const isPhone = (c) => /^\+?[1-9]\d{6,14}$/.test(c);
    const isEmail = (c) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c);

    assert('+8801712345678 is valid phone (E.164)', isPhone('+8801712345678'));
    assert('12345678901 is valid phone (no prefix)', isPhone('12345678901'));
    assert('01712345678 is NOT valid (leading zero)', !isPhone('01712345678'));
    assert('abc is NOT valid phone', !isPhone('abc'));
    assert('user@example.com is valid email', isEmail('user@example.com'));
    assert('notanemail is NOT valid email', !isEmail('notanemail'));
}

// ── Summary ──────────────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════════');
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log('══════════════════════════════════════════\n');

if (failed > 0) process.exit(1);
