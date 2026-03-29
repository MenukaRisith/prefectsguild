"use client";

import { useActionState } from "react";
import { ActionFeedback } from "@/components/action-feedback";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  assignDutyAction,
  createAnnouncementAction,
  createClassAction,
  createEventAction,
  createLocationAction,
  createStaffAction,
  createTaskAction,
  submitAbsenceAction,
} from "@/lib/actions/dashboard-actions";
import { initialActionState } from "@/lib/action-state";

function FieldError({
  errors,
  name,
}: {
  errors?: Record<string, string[]>;
  name: string;
}) {
  const message = errors?.[name]?.[0];

  if (!message) {
    return null;
  }

  return <p className="text-sm text-rose-600 dark:text-rose-300">{message}</p>;
}

function NativeSelect({
  children,
  name,
  defaultValue,
}: {
  children: React.ReactNode;
  name: string;
  defaultValue?: string;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="flex h-11 w-full rounded-2xl border border-input bg-background px-3 text-sm shadow-sm outline-none ring-0 transition focus:border-ring"
    >
      {children}
    </select>
  );
}

export function CreateStaffForm() {
  const [state, action] = useActionState(createStaffAction, initialActionState);

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle>Create teacher or admin account</CardTitle>
        <CardDescription>
          Staff self-registration is disabled. Super admins provision accounts here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <ActionFeedback state={state} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-fullName">Full name</Label>
            <Input id="staff-fullName" name="fullName" />
            <FieldError errors={state.errors} name="fullName" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-email">Email</Label>
            <Input id="staff-email" name="email" type="email" />
            <FieldError errors={state.errors} name="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-whatsapp">WhatsApp</Label>
            <Input id="staff-whatsapp" name="whatsappNumber" />
            <FieldError errors={state.errors} name="whatsappNumber" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-password">Temporary password</Label>
            <Input id="staff-password" name="password" type="password" />
            <FieldError errors={state.errors} name="password" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="staff-role">Role</Label>
            <NativeSelect name="role" defaultValue="TEACHER">
              <option value="TEACHER">Teacher</option>
              <option value="ADMIN">Admin</option>
            </NativeSelect>
          </div>
          <div className="md:col-span-2">
            <SubmitButton className="rounded-full" pendingLabel="Creating staff account...">
              Create account
            </SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function CreateClassForm() {
  const [state, action] = useActionState(createClassAction, initialActionState);

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle>Academic duty target</CardTitle>
        <CardDescription>Add or update a class by grade and section.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="class-grade">Grade</Label>
            <Input id="class-grade" name="grade" type="number" min={6} max={13} />
            <FieldError errors={state.errors} name="grade" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="class-section">Section</Label>
            <Input id="class-section" name="section" placeholder="A / Science" />
            <FieldError errors={state.errors} name="section" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="class-label">Label</Label>
            <Input id="class-label" name="label" placeholder="Grade 10 - A" />
            <FieldError errors={state.errors} name="label" />
          </div>
          <div className="md:col-span-3">
            <ActionFeedback state={state} />
          </div>
          <div className="md:col-span-3">
            <SubmitButton className="rounded-full" pendingLabel="Saving class...">
              Save class
            </SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function CreateLocationForm() {
  const [state, action] = useActionState(createLocationAction, initialActionState);

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle>Duty location</CardTitle>
        <CardDescription>Create named places like Main Gate or Prefect Office.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <ActionFeedback state={state} />
          <div className="space-y-2">
            <Label htmlFor="location-name">Location name</Label>
            <Input id="location-name" name="name" placeholder="Main Gate" />
            <FieldError errors={state.errors} name="name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location-description">Description</Label>
            <Textarea id="location-description" name="description" placeholder="Optional context for the duty location" />
            <FieldError errors={state.errors} name="description" />
          </div>
          <SubmitButton className="rounded-full" pendingLabel="Saving location...">
            Save location
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}

export function AssignDutyForm({
  prefects,
  classes,
  locations,
}: {
  prefects: Array<{ id: string; fullName: string }>;
  classes: Array<{ id: string; label: string }>;
  locations: Array<{ id: string; name: string }>;
}) {
  const [state, action] = useActionState(assignDutyAction, initialActionState);

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle>Assign duty</CardTitle>
        <CardDescription>Admins assign duties to individual prefects.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Prefect</Label>
            <NativeSelect name="assigneeId">
              <option value="">Select prefect</option>
              {prefects.map((prefect) => (
                <option key={prefect.id} value={prefect.id}>
                  {prefect.fullName}
                </option>
              ))}
            </NativeSelect>
            <FieldError errors={state.errors} name="assigneeId" />
          </div>
          <div className="space-y-2">
            <Label>Duty type</Label>
            <NativeSelect name="kind" defaultValue="ACADEMIC">
              <option value="ACADEMIC">Academic class</option>
              <option value="LOCATION">Named location</option>
            </NativeSelect>
            <FieldError errors={state.errors} name="kind" />
          </div>
          <div className="space-y-2">
            <Label>Class target</Label>
            <NativeSelect name="academicClassId">
              <option value="">Select class</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </NativeSelect>
            <FieldError errors={state.errors} name="academicClassId" />
          </div>
          <div className="space-y-2">
            <Label>Location target</Label>
            <NativeSelect name="dutyLocationId">
              <option value="">Select location</option>
              {locations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </NativeSelect>
            <FieldError errors={state.errors} name="dutyLocationId" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duty-title">Duty title</Label>
            <Input id="duty-title" name="title" placeholder="Morning duty" />
            <FieldError errors={state.errors} name="title" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duty-startsOn">Starts on</Label>
            <Input id="duty-startsOn" name="startsOn" type="datetime-local" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duty-endsOn">Ends on</Label>
            <Input id="duty-endsOn" name="endsOn" type="datetime-local" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="duty-notes">Notes</Label>
            <Textarea id="duty-notes" name="notes" placeholder="Additional assignment details" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <ActionFeedback state={state} />
          </div>
          <div className="md:col-span-2">
            <SubmitButton className="rounded-full" pendingLabel="Assigning duty...">
              Assign duty
            </SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function CreateTaskForm({
  prefects,
}: {
  prefects: Array<{ id: string; fullName: string }>;
}) {
  const [state, action] = useActionState(createTaskAction, initialActionState);

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle>Create task</CardTitle>
        <CardDescription>Admins can issue task ownership and deadlines.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <ActionFeedback state={state} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="task-title">Task title</Label>
            <Input id="task-title" name="title" placeholder="Morning assembly preparation" />
            <FieldError errors={state.errors} name="title" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="task-description">Task description</Label>
            <Textarea id="task-description" name="description" placeholder="What needs to be done and any constraints" />
          </div>
          <div className="space-y-2">
            <Label>Assignee</Label>
            <NativeSelect name="assigneeId">
              <option value="">Select prefect</option>
              {prefects.map((prefect) => (
                <option key={prefect.id} value={prefect.id}>
                  {prefect.fullName}
                </option>
              ))}
            </NativeSelect>
            <FieldError errors={state.errors} name="assigneeId" />
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <NativeSelect name="priority" defaultValue="MEDIUM">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </NativeSelect>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="task-dueAt">Due date</Label>
            <Input id="task-dueAt" name="dueAt" type="datetime-local" />
          </div>
          <div className="md:col-span-2">
            <SubmitButton className="rounded-full" pendingLabel="Creating task...">
              Create task
            </SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function CreateEventForm() {
  const [state, action] = useActionState(createEventAction, initialActionState);

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle>Create calendar event</CardTitle>
        <CardDescription>Publish school-wide prefect events and reminders.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <ActionFeedback state={state} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="event-title">Title</Label>
            <Input id="event-title" name="title" placeholder="Inter-house sports duty briefing" />
            <FieldError errors={state.errors} name="title" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="event-description">Description</Label>
            <Textarea id="event-description" name="description" placeholder="Optional event notes" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-location">Location</Label>
            <Input id="event-location" name="location" placeholder="Main Hall" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-date">Event date</Label>
            <Input id="event-date" name="eventDate" type="datetime-local" />
            <FieldError errors={state.errors} name="eventDate" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Audience</Label>
            <NativeSelect name="audience" defaultValue="ALL_PREFECTS">
              <option value="ALL_PREFECTS">All prefects</option>
              <option value="STAFF_ONLY">Staff only</option>
              <option value="CUSTOM">Custom audience</option>
            </NativeSelect>
          </div>
          <div className="md:col-span-2">
            <SubmitButton className="rounded-full" pendingLabel="Publishing event...">
              Publish event
            </SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function CreateAnnouncementForm() {
  const [state, action] = useActionState(createAnnouncementAction, initialActionState);

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle>Publish announcement</CardTitle>
        <CardDescription>Important updates appear on every relevant dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <ActionFeedback state={state} />
          <div className="space-y-2">
            <Label htmlFor="announcement-title">Title</Label>
            <Input id="announcement-title" name="title" placeholder="Guild meeting moved to 2:00 PM" />
            <FieldError errors={state.errors} name="title" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="announcement-body">Message</Label>
            <Textarea id="announcement-body" name="body" placeholder="Enter the announcement body" className="min-h-36" />
            <FieldError errors={state.errors} name="body" />
          </div>
          <div className="space-y-2">
            <Label>Audience</Label>
            <NativeSelect name="audience" defaultValue="ALL">
              <option value="ALL">All users</option>
              <option value="PREFECTS">Prefects only</option>
              <option value="STAFF">Staff only</option>
              <option value="ADMINS">Admins only</option>
            </NativeSelect>
          </div>
          <SubmitButton className="rounded-full" pendingLabel="Publishing...">
            Publish announcement
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}

export function AbsenceRequestForm() {
  const [state, action] = useActionState(submitAbsenceAction, initialActionState);

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle>Submit absence reason</CardTitle>
        <CardDescription>
          Use this for today or upcoming dates when you cannot attend school.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <ActionFeedback state={state} />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="absence-startDate">Start date</Label>
              <Input id="absence-startDate" name="startDate" type="date" />
              <FieldError errors={state.errors} name="startDate" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="absence-endDate">End date</Label>
              <Input id="absence-endDate" name="endDate" type="date" />
              <FieldError errors={state.errors} name="endDate" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="absence-reason">Reason</Label>
            <Textarea
              id="absence-reason"
              name="reason"
              className="min-h-32"
              placeholder="Explain why you will be absent or why attendance was missed."
            />
            <FieldError errors={state.errors} name="reason" />
          </div>
          <SubmitButton className="rounded-full" pendingLabel="Submitting reason...">
            Submit reason
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}

export function InlinePostButton({
  name,
  value,
  label,
  variant = "outline",
}: {
  name: string;
  value: string;
  label: string;
  variant?: "outline" | "default" | "ghost";
}) {
  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Button type="submit" variant={variant} className="rounded-full">
        {label}
      </Button>
    </>
  );
}
