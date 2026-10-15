---
title: "Beyond the Diagnosis: Clinical Information Architecture for Chronic Care"
seoTitle: "Beyond the Diagnosis: Clinical Information Architecture for Chronic Care - Pfitztronic"
description: "Why chronic care records should preserve clinical goals, progress, interventions and next decisions across encounters."
published: "2026-08-24"
image: "/img/blogs/clinical-information-architecture.jpg"
imageAlt: "Clinician reviewing a digital patient record"
author: "Dr Tendai Pfidze"
authorImage: "/img/blogs/drpfidze-small.jpg"
authorBio: "Dr Tendai Pfidze holds an MBChB and an MSc in Computer Science and is a Certified Business Architect. With extensive experience across clinical practice, software and IoT, he is passionate about sustainable digital transformation."
cta:
  heading: "Architect better clinical systems"
  text: "Pfitztronic helps healthcare organisations connect clinical goals, information, processes and technology through practical architecture."
---

A recent ward round made me think about something that is easily overlooked in clinical practice: **as care progresses, knowing the diagnosis is not enough. We increasingly need to know what we are trying to achieve for that particular patient.**

Consider a patient admitted with an exacerbation of heart failure, perhaps precipitated by pneumonia. The diagnosis tells us what is wrong, but it does not completely tell us what we should do next. Two patients with the same diagnosis may have very different baseline function, comorbidities, severity of disease and realistic outcomes.

What gives management direction are the **treatment goals**.

For one patient, we may want to restore adequate oxygenation, relieve congestion and return functional capacity toward their previous baseline. Another patient with the same diagnosis may have advanced disease where those same outcomes are unrealistic. The diagnosis may be identical; the goals, interventions and expected outcomes are not.

These goals also change throughout an admission. Some are achieved. Some become unattainable and are revised or abandoned. New problems emerge and generate new goals. Priorities change.

This means that on every ward round, the clinically useful question is not simply:

What diagnoses does this patient have?

It is also:

What are we currently trying to achieve, how close are we to achieving it, and what needs to happen next?

## The problem becomes even clearer in chronic outpatient care

In an inpatient ward, clinical information becomes fragmented across several days of progress notes. In outpatient care, the same problem can extend across **months or years**.

A patient with diabetes, hypertension, heart failure or another chronic illness may accumulate pages of consultation notes. Each encounter documents what happened that particular day, but the longitudinal management intent can gradually disappear into the record.

When the outpatient department is busy, this creates another risk: care can become increasingly **encounter-driven rather than goal-directed**.

The patient presents with a problem today, we address it, document it and move on. At the next visit another problem is addressed. Yet the larger questions may become progressively harder to answer:

What are we ultimately trying to achieve for this patient's hypertension? What target did we agree upon? Has it been achieved? What was the strategy if it was not achieved? What are we trying to prevent? Which goals are most important now? Has something changed that requires us to reconsider them?

The answers may exist somewhere in the record, but finding them may require reconstructing clinical reasoning from multiple consultations scattered across an outpatient card.

This is not simply a documentation problem. It is an information architecture problem.

## Clinical records are often organised around encounters rather than clinical intent

Traditional medical documentation is largely chronological:

> Admission → progress note → progress note → consultation → discharge

or in outpatient care:

> Visit → visit → visit → visit → visit

But chronic disease management is not fundamentally a sequence of visits.

It is a collection of **persistent clinical problems, goals, interventions and outcomes that evolve over time**.

A treatment goal should therefore not belong exclusively to the consultation during which it was written. The consultation is simply the event during which that goal was created, reviewed or modified.

The goal itself should persist.

The information model could instead connect:

> Clinical problem → Treatment goal → Target/measure → Intervention → Current status → Next decision

For example, a patient with hypertension might have an active goal containing the individualized blood-pressure target, current performance against that target, present treatment strategy, barriers identified and the next planned decision if control remains inadequate.

At the next consultation, the clinician should not have to reconstruct this management logic from six previous notes. It should already be available.

The consultation then becomes an opportunity to **update the patient's longitudinal management state**, rather than recreate it.

## A different kind of clinical dashboard

This suggests that digital clinical systems need to move beyond merely reproducing paper documentation electronically.

For chronic conditions, a clinician opening the patient's record should be able to see a persistent management view showing the patient's:

- active problems;

- current treatment goals;

- measurable targets where appropriate;

- progress toward each goal;

- current interventions;

- unresolved barriers or risks;

- next planned decisions; and

- goals that have been achieved, revised or abandoned.

Goals themselves could have a lifecycle:

> Proposed → Active → Achieved / Revised / Abandoned

Their priority could change without losing their history.

The traditional progress note would still have an important role. It provides the narrative, observations and clinical reasoning associated with a particular encounter. But it should not be the only place where critical longitudinal information lives.

This distinction matters.

The note records the encounter. The clinical information architecture should represent the patient's evolving state.

## Digitising paper is not enough

This is also why simply replacing paper files with electronic notes does not necessarily constitute meaningful digital transformation.

If an electronic medical record gives clinicians twenty electronic pages to search instead of twenty physical pages to flip through, we have improved retrieval without necessarily solving the underlying problem.

Searchable poor information architecture remains poor information architecture.

The greater opportunity of digitisation is to structure clinical information around how care actually works.

This becomes particularly important in chronic disease, where management is longitudinal, multidisciplinary and increasingly complex. Different clinicians may see the patient at different times. New conditions emerge. Goals compete with one another. Treatments interact. Patient preferences change. Some targets become inappropriate as disease progresses.

The clinical information system therefore needs to preserve not only **what has happened**, but also **what we are trying to achieve now**.

## Clinical information architecture as a patient-safety capability

This changes the argument for healthcare digitisation.

The case for digital health is often framed around efficiency: faster retrieval of records, reduced paperwork, easier reporting and better access to data.

Those benefits matter. But chronic disease management exposes a deeper requirement.

Healthcare increasingly asks clinicians to maintain longitudinal awareness of multiple interacting problems, goals, interventions and outcomes across many encounters and often across multiple healthcare professionals.

There is a limit to how much of that complexity we can reasonably expect clinicians to reconstruct from chronological documentation, particularly in busy clinical environments.

At that point, information architecture becomes part of clinical safety.

A well-designed digital health system should reduce the cognitive work required merely to understand where the patient currently stands. It should preserve clinical intent across encounters, make important goals visible, show progress toward them and support continuity when responsibility moves from one clinician to another.

The design principle may therefore be quite simple:

> Chronic care should be organised around persistent clinical problems and goals, not merely around a sequence of encounters.

Perhaps the question is no longer simply whether healthcare should become digital.

The more important question is whether our clinical information systems are being designed around **how clinicians actually manage patients over time**.
