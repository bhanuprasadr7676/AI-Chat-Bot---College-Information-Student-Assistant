import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import {
  db,
  handleFirestoreError,
  OperationType,
  ROOT_ADMIN_EMAIL,
} from '../lib/firebase';
import {
  buildDefaultAttendanceTemplates,
  buildDefaultFeeTemplates,
  DEFAULT_FACULTY,
  DEFAULT_NOTICES,
  DEFAULT_PLACEMENTS,
  DEFAULT_SCHOLARSHIPS,
  DEFAULT_SYSTEM_SETTINGS,
  DEFAULT_TIMETABLE,
  DEFAULT_TIMINGS,
} from '../data/defaultCampusData';
import type {
  AttendanceRecord,
  CollegeTiming,
  FacultyMember,
  FeeRecord,
  NoticeItem,
  PlacementDrive,
  ScholarshipItem,
  SystemSettings,
  TimetableSlot,
  UserProfile,
  UserRole,
} from '../types/campus';

function clampStr(value: string | undefined, maxLen: number, fallback = ''): string {
  const raw = (value ?? '').trim();
  const s = raw.length > 0 ? raw : fallback.trim();
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

export function makeSafeDocId(prefix: string): string {
  const raw = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 120);
}

export async function checkIsAdminUser(user: User): Promise<boolean> {
  if (!user.emailVerified) return false;
  if (user.email === ROOT_ADMIN_EMAIL) return true;
  const adminPath = `admins/${user.uid}`;
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, adminPath);
  }
}

export interface StudentRegistrationMeta {
  displayName?: string;
  rollNumber?: string;
  department?: string;
  semester?: number;
  phone?: string;
  isRegistration?: boolean;
}

const profileSyncLocks = new Map<string, Promise<UserProfile>>();

export function ensureUserProfile(
  user: User,
  registrationMeta?: StudentRegistrationMeta
): Promise<UserProfile> {
  const previous = profileSyncLocks.get(user.uid) ?? Promise.resolve(null as unknown as UserProfile);
  const next = previous
    .catch(() => null)
    .then(() => runEnsureUserProfile(user, registrationMeta));
  profileSyncLocks.set(user.uid, next);
  return next;
}

async function runEnsureUserProfile(
  user: User,
  registrationMeta?: StudentRegistrationMeta
): Promise<UserProfile> {
  const userPath = `users/${user.uid}`;
  const isRoot = Boolean(user.emailVerified && user.email === ROOT_ADMIN_EMAIL);

  let profile: UserProfile;
  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      if (registrationMeta?.isRegistration) {
        const nextDisplayName =
          clampStr(registrationMeta.displayName, 120, data.displayName) || data.displayName;
        const nextDept =
          clampStr(registrationMeta.department, 100, data.department) || data.department;
        const nextSemester =
          registrationMeta.semester !== undefined && Number.isFinite(registrationMeta.semester)
            ? Math.min(12, Math.max(1, Math.round(registrationMeta.semester)))
            : data.semester;
        const nextPhone =
          registrationMeta.phone !== undefined
            ? clampStr(registrationMeta.phone, 32)
            : data.phone || '';
        const nextRole = isRoot ? 'admin' : data.role;
        const nextRoll =
          isRoot && registrationMeta.rollNumber
            ? clampStr(registrationMeta.rollNumber, 32, data.rollNumber) || data.rollNumber
            : data.rollNumber;

        const updatePayload: Record<string, unknown> = {
          displayName: nextDisplayName,
          department: nextDept,
          semester: nextSemester,
          phone: nextPhone,
          updatedAt: serverTimestamp(),
        };
        if (isRoot && nextRole !== data.role) {
          updatePayload.role = nextRole;
        }
        if (isRoot && nextRoll !== data.rollNumber) {
          updatePayload.rollNumber = nextRoll;
        }

        await updateDoc(userRef, updatePayload);
        profile = {
          ...data,
          displayName: nextDisplayName,
          department: nextDept,
          semester: nextSemester,
          phone: nextPhone,
          role: nextRole,
          rollNumber: nextRoll,
        };
      } else if (isRoot && data.role !== 'admin') {
        await updateDoc(userRef, { role: 'admin', updatedAt: serverTimestamp() });
        profile = { ...data, role: 'admin' };
      } else {
        profile = data;
      }
    } else {
      const fallbackRoll = `CIT-${user.uid.slice(0, 6).toUpperCase()}`;
      const rollNum = clampStr(registrationMeta?.rollNumber, 32, fallbackRoll) || fallbackRoll;
      const dept =
        clampStr(registrationMeta?.department, 100, 'Computer Science') || 'Computer Science';
      const sem =
        registrationMeta?.semester !== undefined && Number.isFinite(registrationMeta.semester)
          ? Math.min(12, Math.max(1, Math.round(registrationMeta.semester)))
          : 5;
      const displayName =
        clampStr(registrationMeta?.displayName, 120, user.displayName ?? 'Campus Student') ||
        clampStr(user.displayName ?? '', 120, 'Campus Student');
      const phone =
        registrationMeta?.phone !== undefined
          ? clampStr(registrationMeta.phone, 32)
          : '+1 (555) 014-3920';

      const newProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'> = {
        uid: user.uid,
        email: clampStr(user.email ?? '', 200, 'student@crestwood.edu'),
        displayName,
        photoUrl: clampStr(user.photoURL ?? '', 500),
        role: isRoot ? 'admin' : 'student',
        rollNumber: rollNum,
        department: dept,
        semester: sem,
        cgpa: 8.6,
        phone,
        mentorName: 'Dr. Maya Vance',
        isActive: true,
      };

      await setDoc(userRef, {
        ...newProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      profile = newProfile;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }

  if (isRoot) {
    const adminPath = `admins/${user.uid}`;
    try {
      const adminRef = doc(db, 'admins', user.uid);
      const adminSnap = await getDoc(adminRef);
      if (!adminSnap.exists()) {
        await setDoc(adminRef, {
          uid: user.uid,
          email: profile.email,
          grantedBy: 'system_bootstrap',
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, adminPath);
    }
  }

  return profile;
}

export function subscribePublicCollection<T>(
  collectionName: string,
  isRootAdmin: boolean,
  onData: (items: T[]) => void
): Unsubscribe {
  const q = isRootAdmin
    ? query(collection(db, collectionName))
    : query(collection(db, collectionName), where('isPublished', '==', true));

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Record<string, unknown>),
      })) as T[];
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionName);
    }
  );
}

export function subscribeSystemSettings(
  onData: (settings: SystemSettings | null) => void
): Unsubscribe {
  const path = 'settings/campus_config';
  return onSnapshot(
    doc(db, 'settings', 'campus_config'),
    (snap) => {
      if (snap.exists()) {
        onData(snap.data() as SystemSettings);
      } else {
        onData(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeStudentAttendance(
  uid: string,
  onData: (records: AttendanceRecord[]) => void
): Unsubscribe {
  const path = 'attendance';
  const q = query(collection(db, path), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<AttendanceRecord, 'id'>),
        }))
      );
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeStudentFees(
  uid: string,
  onData: (records: FeeRecord[]) => void
): Unsubscribe {
  const path = 'fees';
  const q = query(collection(db, path), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<FeeRecord, 'id'>),
        }))
      );
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeAllUsersAdmin(
  onData: (users: UserProfile[]) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'users'),
    (snap) => {
      onData(snap.docs.map((d) => d.data() as UserProfile));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    }
  );
}

export function subscribeAllAttendanceAdmin(
  onData: (records: AttendanceRecord[]) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'attendance'),
    (snap) => {
      onData(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<AttendanceRecord, 'id'>),
        }))
      );
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'attendance');
    }
  );
}

export function subscribeAllFeesAdmin(
  onData: (records: FeeRecord[]) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'fees'),
    (snap) => {
      onData(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<FeeRecord, 'id'>),
        }))
      );
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'fees');
    }
  );
}

export async function updateOwnStudentProfile(
  uid: string,
  updates: {
    displayName: string;
    phone: string;
    department: string;
    semester: number;
  }
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      displayName: clampStr(updates.displayName, 120, 'Student'),
      phone: clampStr(updates.phone, 32),
      department: clampStr(updates.department, 100, 'Computer Science'),
      semester: Math.min(12, Math.max(1, Math.round(updates.semester))),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function payOwnFeeRecord(fee: FeeRecord): Promise<void> {
  const path = `fees/${fee.id}`;
  try {
    const receiptNo = `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    await updateDoc(doc(db, 'fees', fee.id), {
      status: 'paid',
      paidAmount: fee.amount,
      receiptNo,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function adminUpdateUserProfile(
  targetUser: UserProfile,
  adminUid: string
): Promise<void> {
  const path = `users/${targetUser.uid}`;
  const nextSemester = Number.isFinite(targetUser.semester)
    ? Math.min(12, Math.max(1, Math.round(targetUser.semester)))
    : 1;
  const nextCgpa = Number.isFinite(targetUser.cgpa)
    ? Math.min(10, Math.max(0, Number(targetUser.cgpa)))
    : 0;
  try {
    await updateDoc(doc(db, 'users', targetUser.uid), {
      displayName: clampStr(targetUser.displayName, 120, 'Student'),
      role: targetUser.role,
      rollNumber: clampStr(targetUser.rollNumber, 32, `CIT-${targetUser.uid.slice(0, 6).toUpperCase()}`),
      department: clampStr(targetUser.department, 100, 'Computer Science'),
      semester: nextSemester,
      cgpa: nextCgpa,
      phone: clampStr(targetUser.phone, 32),
      mentorName: clampStr(targetUser.mentorName, 120, 'Dr. Maya Vance'),
      isActive: Boolean(targetUser.isActive),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }

  const adminPath = `admins/${targetUser.uid}`;
  try {
    const adminRef = doc(db, 'admins', targetUser.uid);
    const adminSnap = await getDoc(adminRef);
    if (targetUser.role === 'admin') {
      if (!adminSnap.exists()) {
        await setDoc(adminRef, {
          uid: targetUser.uid,
          email: clampStr(targetUser.email, 200),
          grantedBy: adminUid,
          createdAt: serverTimestamp(),
        });
      }
    } else if (targetUser.uid !== adminUid && targetUser.email !== ROOT_ADMIN_EMAIL) {
      if (adminSnap.exists()) {
        await deleteDoc(adminRef);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, adminPath);
  }
}

export async function adminSaveSystemSettings(settings: SystemSettings): Promise<void> {
  const path = 'settings/campus_config';
  try {
    await setDoc(doc(db, 'settings', 'campus_config'), {
      institutionName: clampStr(settings.institutionName, 160),
      academicYear: clampStr(settings.academicYear, 32),
      currentSemester: clampStr(settings.currentSemester, 40),
      minAttendancePercent: Math.min(100, Math.max(0, Math.round(settings.minAttendancePercent))),
      aiAssistantEnabled: Boolean(settings.aiAssistantEnabled),
      strictAcademicMode: Boolean(settings.strictAcademicMode),
      googleSearchRedirectBase: clampStr(settings.googleSearchRedirectBase, 200),
      supportEmail: clampStr(settings.supportEmail, 160),
      supportPhone: clampStr(settings.supportPhone, 40),
      portalAnnouncement: clampStr(settings.portalAnnouncement, 300),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function adminSeedStudentRecords(
  userId: string,
  studentName: string
): Promise<void> {
  try {
    const batch = writeBatch(db);
    const attList = buildDefaultAttendanceTemplates(userId);
    for (const item of attList) {
      const id = makeSafeDocId(`att_${userId.slice(0, 8)}`);
      batch.set(doc(db, 'attendance', id), {
        ...item,
        updatedAt: serverTimestamp(),
      });
    }
    const feeList = buildDefaultFeeTemplates(userId, clampStr(studentName, 120, 'Student'));
    for (const fee of feeList) {
      const id = makeSafeDocId(`fee_${userId.slice(0, 8)}`);
      batch.set(doc(db, 'fees', id), {
        ...fee,
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'attendance_fees_seed');
  }
}

export async function adminSeedAllCampusData(): Promise<void> {
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'settings', 'campus_config'), {
      ...DEFAULT_SYSTEM_SETTINGS,
      updatedAt: serverTimestamp(),
    });

    for (const item of DEFAULT_FACULTY) {
      const { id, ...rest } = item;
      batch.set(doc(db, 'faculty', id), { ...rest, updatedAt: serverTimestamp() });
    }
    for (const item of DEFAULT_TIMETABLE) {
      const { id, ...rest } = item;
      batch.set(doc(db, 'timetable', id), { ...rest, updatedAt: serverTimestamp() });
    }
    for (const item of DEFAULT_TIMINGS) {
      const { id, ...rest } = item;
      batch.set(doc(db, 'timings', id), { ...rest, updatedAt: serverTimestamp() });
    }
    for (const item of DEFAULT_NOTICES) {
      const { id, ...rest } = item;
      batch.set(doc(db, 'notices', id), { ...rest, updatedAt: serverTimestamp() });
    }
    for (const item of DEFAULT_SCHOLARSHIPS) {
      const { id, ...rest } = item;
      batch.set(doc(db, 'scholarships', id), { ...rest, updatedAt: serverTimestamp() });
    }
    for (const item of DEFAULT_PLACEMENTS) {
      const { id, ...rest } = item;
      batch.set(doc(db, 'placements', id), { ...rest, updatedAt: serverTimestamp() });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'campus_seed');
  }
}

export async function seedCampusIfEmpty(uid: string, displayName: string): Promise<void> {
  try {
    const settingsSnap = await getDoc(doc(db, 'settings', 'campus_config'));
    if (!settingsSnap.exists()) {
      await adminSeedAllCampusData();
    }
    const attSnap = await getDocs(query(collection(db, 'attendance'), where('userId', '==', uid)));
    const feeSnap = await getDocs(query(collection(db, 'fees'), where('userId', '==', uid)));
    if (attSnap.empty && feeSnap.empty) {
      await adminSeedStudentRecords(uid, displayName);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'initial_seed');
  }
}

export async function adminUpsertAttendance(record: Omit<AttendanceRecord, 'id'> & { id?: string }): Promise<void> {
  const id = record.id || makeSafeDocId('att');
  const path = `attendance/${id}`;
  try {
    await setDoc(doc(db, 'attendance', id), {
      userId: clampStr(record.userId, 128),
      subjectCode: clampStr(record.subjectCode, 24),
      subjectName: clampStr(record.subjectName, 140),
      facultyName: clampStr(record.facultyName, 120),
      attendedClasses: Math.max(0, Math.round(record.attendedClasses)),
      totalClasses: Math.max(Math.round(record.attendedClasses), Math.round(record.totalClasses)),
      semester: Math.min(12, Math.max(1, Math.round(record.semester))),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function adminUpsertFee(record: Omit<FeeRecord, 'id'> & { id?: string }): Promise<void> {
  const id = record.id || makeSafeDocId('fee');
  const path = `fees/${id}`;
  try {
    const amount = Math.max(0, Number(record.amount));
    const paidAmount = Math.min(amount, Math.max(0, Number(record.paidAmount)));
    await setDoc(doc(db, 'fees', id), {
      userId: clampStr(record.userId, 128),
      studentName: clampStr(record.studentName, 120),
      title: clampStr(record.title, 140),
      category: record.category,
      semester: Math.min(12, Math.max(1, Math.round(record.semester))),
      amount,
      paidAmount,
      dueDate: clampStr(record.dueDate, 32),
      status: record.status,
      receiptNo: clampStr(record.receiptNo, 64),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function adminUpsertFaculty(item: Omit<FacultyMember, 'id'> & { id?: string }): Promise<void> {
  const id = item.id || makeSafeDocId('fac');
  try {
    await setDoc(doc(db, 'faculty', id), {
      name: clampStr(item.name, 120),
      designation: clampStr(item.designation, 100),
      department: clampStr(item.department, 100),
      officeEmail: clampStr(item.officeEmail, 160),
      officeRoom: clampStr(item.officeRoom, 64),
      officeHours: clampStr(item.officeHours, 120),
      specialization: clampStr(item.specialization, 160),
      photoUrl: clampStr(item.photoUrl, 500),
      isPublished: Boolean(item.isPublished),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `faculty/${id}`);
  }
}

export async function adminUpsertTimetable(item: Omit<TimetableSlot, 'id'> & { id?: string }): Promise<void> {
  const id = item.id || makeSafeDocId('tt');
  try {
    await setDoc(doc(db, 'timetable', id), {
      day: item.day,
      startTime: clampStr(item.startTime, 16),
      endTime: clampStr(item.endTime, 16),
      courseCode: clampStr(item.courseCode, 24),
      courseTitle: clampStr(item.courseTitle, 140),
      facultyName: clampStr(item.facultyName, 120),
      room: clampStr(item.room, 48),
      department: clampStr(item.department, 100),
      semester: Math.min(12, Math.max(1, Math.round(item.semester))),
      isPublished: Boolean(item.isPublished),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `timetable/${id}`);
  }
}

export async function adminUpsertTiming(item: Omit<CollegeTiming, 'id'> & { id?: string }): Promise<void> {
  const id = item.id || makeSafeDocId('tim');
  try {
    await setDoc(doc(db, 'timings', id), {
      facility: clampStr(item.facility, 120),
      category: item.category,
      weekdaysHours: clampStr(item.weekdaysHours, 80),
      weekendHours: clampStr(item.weekendHours, 80),
      location: clampStr(item.location, 120),
      notes: clampStr(item.notes, 240),
      isPublished: Boolean(item.isPublished),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `timings/${id}`);
  }
}

export async function adminUpsertNotice(item: Omit<NoticeItem, 'id'> & { id?: string }): Promise<void> {
  const id = item.id || makeSafeDocId('not');
  try {
    await setDoc(doc(db, 'notices', id), {
      title: clampStr(item.title, 180),
      category: item.category,
      priority: item.priority,
      summary: clampStr(item.summary, 400),
      body: clampStr(item.body, 2500),
      publishedDate: clampStr(item.publishedDate, 32),
      postedBy: clampStr(item.postedBy, 120),
      isPublished: Boolean(item.isPublished),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `notices/${id}`);
  }
}

export async function adminUpsertScholarship(item: Omit<ScholarshipItem, 'id'> & { id?: string }): Promise<void> {
  const id = item.id || makeSafeDocId('sch');
  try {
    await setDoc(doc(db, 'scholarships', id), {
      name: clampStr(item.name, 160),
      provider: clampStr(item.provider, 140),
      amount: clampStr(item.amount, 80),
      eligibility: clampStr(item.eligibility, 400),
      deadline: clampStr(item.deadline, 32),
      category: item.category,
      status: item.status,
      isPublished: Boolean(item.isPublished),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `scholarships/${id}`);
  }
}

export async function adminUpsertPlacement(item: Omit<PlacementDrive, 'id'> & { id?: string }): Promise<void> {
  const id = item.id || makeSafeDocId('plc');
  try {
    await setDoc(doc(db, 'placements', id), {
      company: clampStr(item.company, 120),
      role: clampStr(item.role, 140),
      packageLpa: clampStr(item.packageLpa, 64),
      minCgpa: Math.min(10, Math.max(0, Number(item.minCgpa))),
      driveDate: clampStr(item.driveDate, 32),
      location: clampStr(item.location, 120),
      eligibleBranches: clampStr(item.eligibleBranches, 200),
      status: item.status,
      isPublished: Boolean(item.isPublished),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `placements/${id}`);
  }
}

export async function adminDeleteDocument(collectionName: string, docId: string): Promise<void> {
  const path = `${collectionName}/${docId}`;
  try {
    await deleteDoc(doc(db, collectionName, docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
