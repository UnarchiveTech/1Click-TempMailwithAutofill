/**
 * Random data generators for form autofill
 */

import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PHONE_AREA_CODE_MAX,
  PHONE_AREA_CODE_MIN,
  PHONE_LAST_PART_MAX,
  PHONE_LAST_PART_MIN,
  PHONE_PART_MAX,
  PHONE_PART_MIN,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from '@/utils/constants.js';

export function generatePassword(): string {
  const length =
    Math.floor(Math.random() * (PASSWORD_MAX_LENGTH - PASSWORD_MIN_LENGTH + 1)) +
    PASSWORD_MIN_LENGTH;
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  let password = '';
  const allChars = lowercase + uppercase + numbers + special;

  password += lowercase[array[0] % lowercase.length];
  password += uppercase[array[1] % uppercase.length];
  password += numbers[array[2] % numbers.length];
  password += special[array[3] % special.length];

  for (let i = 4; i < length; i++) {
    password += allChars[array[i] % allChars.length];
  }

  const passwordArray = password.split('');
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = array[i] % (i + 1);
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }

  return passwordArray.join('');
}

export function generateUsername(): string {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const allChars = letters + numbers;
  const length =
    Math.floor(Math.random() * (USERNAME_MAX_LENGTH - USERNAME_MIN_LENGTH + 1)) +
    USERNAME_MIN_LENGTH;
  let username = '';

  username += letters[Math.floor(Math.random() * letters.length)];

  for (let i = 1; i < length - 1; i++) {
    if (i > 1 && username[i - 1] !== '-' && Math.random() < 0.1) {
      username += '-';
    } else {
      const useNumber = Math.random() < 0.3;
      username += useNumber
        ? numbers[Math.floor(Math.random() * numbers.length)]
        : letters[Math.floor(Math.random() * letters.length)];
    }
  }

  username += allChars[Math.floor(Math.random() * allChars.length)];
  return username;
}

export function generatePhoneNumber(): string {
  const areaCode = Math.floor(
    Math.random() * (PHONE_AREA_CODE_MAX - PHONE_AREA_CODE_MIN + 1) + PHONE_AREA_CODE_MIN
  );
  const firstPart = Math.floor(
    Math.random() * (PHONE_PART_MAX - PHONE_PART_MIN + 1) + PHONE_PART_MIN
  );
  const secondPart = Math.floor(
    Math.random() * (PHONE_LAST_PART_MAX - PHONE_LAST_PART_MIN + 1) + PHONE_LAST_PART_MIN
  );
  return `${areaCode}-${firstPart}-${secondPart}`;
}

export function generateWebsiteUrl(): string {
  const domains = ['com', 'net', 'org', 'io', 'co', 'ai', 'dev'];
  const name = Math.random().toString(36).substring(2, 12);
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `https://www.${name}.${domain}`;
}

export function generateRandomName(): string {
  const firstNames = [
    'James',
    'John',
    'Robert',
    'Michael',
    'William',
    'David',
    'Richard',
    'Joseph',
    'Thomas',
    'Charles',
    'Mary',
    'Patricia',
    'Jennifer',
    'Linda',
    'Elizabeth',
    'Barbara',
    'Susan',
    'Jessica',
    'Sarah',
    'Karen',
  ];
  const lastNames = [
    'Smith',
    'Johnson',
    'Williams',
    'Brown',
    'Jones',
    'Garcia',
    'Miller',
    'Davis',
    'Rodriguez',
    'Martinez',
    'Anderson',
    'Taylor',
    'Thomas',
    'Moore',
    'Jackson',
    'Martin',
    'Lee',
    'Thompson',
    'White',
    'Harris',
  ];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
}
