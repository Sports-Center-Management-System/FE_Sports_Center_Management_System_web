import React, { useEffect, useState } from 'react'
import { PageTitle } from '@/components/common/page-title'

type Exercise = {
  id: string
  name: string
  sets: number
  reps: number
  restSeconds: number
}

type WorkoutPlan = {
  id: string
  title: string
  week: number
  order: number
  exercises: Exercise[]
}

/* =========================================================
   HARD-CODE WORKOUT TEMPLATES
========================================================= */

const workoutPlans: WorkoutPlan[] = [
  {
    id: 'WORKOUT_PLAN_FAT_LOSS_01',
    title: 'Toàn thân A',
    week: 1,
    order: 1,
    exercises: [
      {
        id: 'EXERCISE_SQUAT',
        name: 'Squat',
        sets: 3,
        reps: 12,
        restSeconds: 60,
      },
      {
        id: 'EXERCISE_BENCH_PRESS',
        name: 'Bench Press',
        sets: 3,
        reps: 10,
        restSeconds: 60,
      },
      {
        id: 'EXERCISE_LAT_PULLDOWN',
        name: 'Lat Pulldown',
        sets: 3,
        reps: 12,
        restSeconds: 60,
      },
      {
        id: 'EXERCISE_PLANK',
        name: 'Plank',
        sets: 3,
        reps: 30,
        restSeconds: 45,
      },
    ],
  },

  {
    id: 'WORKOUT_PLAN_FAT_LOSS_02',
    title: 'Cardio và Core',
    week: 1,
    order: 2,
    exercises: [
      {
        id: 'EXERCISE_TREADMILL',
        name: 'Treadmill',
        sets: 1,
        reps: 20,
        restSeconds: 0,
      },
      {
        id: 'EXERCISE_MOUNTAIN_CLIMBER',
        name: 'Mountain Climber',
        sets: 3,
        reps: 20,
        restSeconds: 45,
      },
      {
        id: 'EXERCISE_PLANK',
        name: 'Plank',
        sets: 3,
        reps: 30,
        restSeconds: 45,
      },
      {
        id: 'EXERCISE_BICYCLE_CRUNCH',
        name: 'Bicycle Crunch',
        sets: 3,
        reps: 15,
        restSeconds: 45,
      },
    ],
  },

  {
    id: 'WORKOUT_PLAN_FAT_LOSS_03',
    title: 'Toàn thân B',
    week: 1,
    order: 3,
    exercises: [
      {
        id: 'EXERCISE_LEG_PRESS',
        name: 'Leg Press',
        sets: 3,
        reps: 12,
        restSeconds: 60,
      },
      {
        id: 'EXERCISE_DUMBBELL_BENCH_PRESS',
        name: 'Dumbbell Bench Press',
        sets: 3,
        reps: 12,
        restSeconds: 60,
      },
      {
        id: 'EXERCISE_SEATED_CABLE_ROW',
        name: 'Seated Cable Row',
        sets: 3,
        reps: 12,
        restSeconds: 60,
      },
      {
        id: 'EXERCISE_DUMBBELL_CURL',
        name: 'Dumbbell Curl',
        sets: 3,
        reps: 12,
        restSeconds: 45,
      },
    ],
  },

  {
    id: 'WORKOUT_PLAN_FAT_LOSS_04',
    title: 'Chân và Core',
    week: 2,
    order: 4,
    exercises: [
      {
        id: 'EXERCISE_GOBLET_SQUAT',
        name: 'Goblet Squat',
        sets: 3,
        reps: 12,
        restSeconds: 60,
      },
      {
        id: 'EXERCISE_BULGARIAN_SPLIT_SQUAT',
        name: 'Bulgarian Split Squat',
        sets: 3,
        reps: 10,
        restSeconds: 60,
      },
      {
        id: 'EXERCISE_LEG_CURL',
        name: 'Leg Curl',
        sets: 3,
        reps: 12,
        restSeconds: 60,
      },
      {
        id: 'EXERCISE_BICYCLE_CRUNCH',
        name: 'Bicycle Crunch',
        sets: 3,
        reps: 15,
        restSeconds: 45,
      },
    ],
  },

  {
    id: 'WORKOUT_PLAN_FAT_LOSS_05',
    title: 'Ngực, Vai và Tay',
    week: 2,
    order: 5,
    exercises: [
      {
        id: 'EXERCISE_INCLINE_DUMBBELL_PRESS',
        name: 'Incline Dumbbell Press',
        sets: 3,
        reps: 12,
        restSeconds: 60,
      },
      {
        id: 'EXERCISE_SHOULDER_PRESS',
        name: 'Shoulder Press',
        sets: 3,
        reps: 12,
        restSeconds: 60,
      },
      {
        id: 'EXERCISE_LATERAL_RAISE',
        name: 'Lateral Raise',
        sets: 3,
        reps: 15,
        restSeconds: 45,
      },
      {
        id: 'EXERCISE_TRICEP_PUSHDOWN',
        name: 'Tricep Pushdown',
        sets: 3,
        reps: 15,
        restSeconds: 45,
      },
    ],
  },

  {
    id: 'WORKOUT_PLAN_FAT_LOSS_06',
    title: 'Cardio toàn thân',
    week: 2,
    order: 6,
    exercises: [
      {
        id: 'EXERCISE_TREADMILL',
        name: 'Treadmill',
        sets: 1,
        reps: 25,
        restSeconds: 0,
      },
      {
        id: 'EXERCISE_MOUNTAIN_CLIMBER',
        name: 'Mountain Climber',
        sets: 4,
        reps: 20,
        restSeconds: 45,
      },
      {
        id: 'EXERCISE_JUMPING_JACK',
        name: 'Jumping Jack',
        sets: 3,
        reps: 30,
        restSeconds: 45,
      },
      {
        id: 'EXERCISE_PLANK',
        name: 'Plank',
        sets: 3,
        reps: 40,
        restSeconds: 45,
      },
    ],
  },

  {
    id: 'WORKOUT_PLAN_FAT_LOSS_07',
    title: 'Toàn thân C',
    week: 3,
    order: 7,
    exercises: [
      {
        id: 'EXERCISE_SQUAT',
        name: 'Squat',
        sets: 3,
        reps: 12,
        restSeconds: 60,
      },
      {
        id: 'EXERCISE_SHOULDER_PRESS',
        name: 'Shoulder Press',
        sets: 3,
        reps: 12,
        restSeconds: 60,
      },
      {
        id: 'EXERCISE_LAT_PULLDOWN',
        name: 'Lat Pulldown',
        sets: 3,
        reps: 12,
        restSeconds: 60,
      },
      {
        id: 'EXERCISE_RUSSIAN_TWIST',
        name: 'Russian Twist',
        sets: 3,
        reps: 20,
        restSeconds: 45,
      },
    ],
  },

  {
    id: 'WORKOUT_PLAN_FAT_LOSS_08',
    title: 'Mông và Chân',
    week: 3,
    order: 8,
    exercises: [
      {
        id: 'EXERCISE_HIP_THRUST',
        name: 'Hip Thrust',
        sets: 3,
        reps: 12,
        restSeconds: 60,
      },
      {
        id: 'EXERCISE_LUNGES',
        name: 'Lunges',
        sets: 3,
        reps: 12,
        restSeconds: 60,
      },
      {
        id: 'EXERCISE_LEG_PRESS',
        name: 'Leg Press',
        sets: 3,
        reps: 12,
        restSeconds: 60,
      },
      {
        id: 'EXERCISE_CALF_RAISE',
        name: 'Calf Raise',
        sets: 3,
        reps: 15,
        restSeconds: 45,
      },
    ],
  },

  {
    id: 'WORKOUT_PLAN_FAT_LOSS_09',
    title: 'Lưng và Core',
    week: 3,
    order: 9,
    exercises: [
      {
        id: 'EXERCISE_LAT_PULLDOWN',
        name: 'Lat Pulldown',
        sets: 3,
        reps: 12,
        restSeconds: 60,
      },
      {
        id: 'EXERCISE_SEATED_CABLE_ROW',
        name: 'Seated Cable Row',
        sets: 3,
        reps: 12,
        restSeconds: 60,
      },
      {
        id: 'EXERCISE_DUMBBELL_CURL',
        name: 'Dumbbell Curl',
        sets: 3,
        reps: 15,
        restSeconds: 45,
      },
      {
        id: 'EXERCISE_PLANK',
        name: 'Plank',
        sets: 3,
        reps: 45,
        restSeconds: 45,
      },
    ],
  },

  {
    id: 'WORKOUT_PLAN_FAT_LOSS_10',
    title: 'Toàn thân D',
    week: 4,
    order: 10,
    exercises: [
      {
        id: 'EXERCISE_GOBLET_SQUAT',
        name: 'Goblet Squat',
        sets: 3,
        reps: 15,
        restSeconds: 60,
      },
      {
        id: 'EXERCISE_BENCH_PRESS',
        name: 'Bench Press',
        sets: 3,
        reps: 10,
        restSeconds: 60,
      },
      {
        id: 'EXERCISE_LAT_PULLDOWN',
        name: 'Lat Pulldown',
        sets: 3,
        reps: 12,
        restSeconds: 60,
      },
      {
        id: 'EXERCISE_MOUNTAIN_CLIMBER',
        name: 'Mountain Climber',
        sets: 3,
        reps: 20,
        restSeconds: 45,
      },
    ],
  },

  {
    id: 'WORKOUT_PLAN_FAT_LOSS_11',
    title: 'Chân và Core',
    week: 4,
    order: 11,
    exercises: [
      {
        id: 'EXERCISE_LEG_PRESS',
        name: 'Leg Press',
        sets: 3,
        reps: 15,
        restSeconds: 60,
      },
      {
        id: 'EXERCISE_BULGARIAN_SPLIT_SQUAT',
        name: 'Bulgarian Split Squat',
        sets: 3,
        reps: 12,
        restSeconds: 60,
      },
      {
        id: 'EXERCISE_LEG_CURL',
        name: 'Leg Curl',
        sets: 3,
        reps: 15,
        restSeconds: 60,
      },
      {
        id: 'EXERCISE_RUSSIAN_TWIST',
        name: 'Russian Twist',
        sets: 3,
        reps: 20,
        restSeconds: 45,
      },
    ],
  },

  {
    id: 'WORKOUT_PLAN_FAT_LOSS_12',
    title: 'Cardio và Toàn thân',
    week: 4,
    order: 12,
    exercises: [
      {
        id: 'EXERCISE_TREADMILL',
        name: 'Treadmill',
        sets: 1,
        reps: 30,
        restSeconds: 0,
      },
      {
        id: 'EXERCISE_SQUAT',
        name: 'Squat',
        sets: 3,
        reps: 15,
        restSeconds: 60,
      },
      {
        id: 'EXERCISE_DUMBBELL_BENCH_PRESS',
        name: 'Dumbbell Bench Press',
        sets: 3,
        reps: 12,
        restSeconds: 60,
      },
      {
        id: 'EXERCISE_MOUNTAIN_CLIMBER',
        name: 'Mountain Climber',
        sets: 4,
        reps: 20,
        restSeconds: 45,
      },
    ],
  },
]

/* =========================================================
   PAGE
========================================================= */

export const WorkoutPlansPage: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null)

  /* Lock background scroll when modal opens */
  useEffect(() => {
    if (!selectedPlan) return

    const originalOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [selectedPlan])

  /* Close modal with ESC */
  useEffect(() => {
    if (!selectedPlan) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedPlan(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedPlan])

  return (
    <>
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <PageTitle eyebrow="MEM-12 · GIÁO ÁN" title="Bài tập của tôi" />

      <p className="muted intro mb-6 text-xs text-slate-500">Giáo án giảm mỡ · 12 buổi · 4 tuần</p>

      {/* =====================================================
          WORKOUT CARDS
      ====================================================== */}

      <div className="card-grid">
        {workoutPlans.map((plan) => (
          <article
            key={plan.id}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedPlan(plan)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                setSelectedPlan(plan)
              }
            }}
            className="
              card
              group
              cursor-pointer
              !text-slate-900
              transition-all
              duration-200
              hover:-translate-y-1
              hover:shadow-lg
              focus:outline-none
              focus:ring-2
              focus:ring-teal-500
              focus:ring-offset-2
            "
          >
            {/* Week / Session */}
            <div className="flex items-start justify-between gap-3">
              <span
                className="
                  inline-flex
                  items-center
                  rounded-full
                  bg-emerald-50
                  px-3
                  py-2
                  text-xs
                  font-semibold
                  text-teal-700
                "
              >
                Tuần {plan.week}
                <span className="mx-1">·</span>
                Buổi {plan.order}
              </span>

              <span
                className="
                  text-xs
                  font-medium
                  text-slate-400
                  opacity-0
                  transition
                  group-hover:opacity-100
                "
              >
                Xem →
              </span>
            </div>

            {/* Title */}
            <h2
              className="
                mt-5
                !text-slate-900
                text-xl
                font-bold
              "
            >
              {plan.title}
            </h2>

            <p className="mt-1 text-sm text-slate-500">{plan.exercises.length} bài tập</p>

            {/* Exercise preview */}
            <div className="mt-5 space-y-2">
              {plan.exercises.slice(0, 3).map((exercise) => (
                <div
                  key={`${plan.id}-${exercise.id}`}
                  className="
                    flex
                    items-center
                    justify-between
                    rounded-lg
                    bg-slate-50
                    px-3
                    py-2
                    text-sm
                  "
                >
                  <span className="truncate font-medium text-slate-700">{exercise.name}</span>

                  <span className="ml-3 shrink-0 text-xs text-slate-400">
                    {exercise.sets} × {exercise.reps}
                  </span>
                </div>
              ))}

              {plan.exercises.length > 3 && (
                <p className="pt-1 text-xs font-medium text-slate-400">
                  + {plan.exercises.length - 3} bài tập khác
                </p>
              )}
            </div>

            {/* Footer */}
            <div
              className="
                mt-5
                border-t
                border-slate-100
                pt-4
                text-sm
                font-semibold
                text-teal-700
              "
            >
              Xem chi tiết →
            </div>
          </article>
        ))}
      </div>

      {/* =====================================================
          MODAL
      ====================================================== */}

      {selectedPlan && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-slate-950/55
            p-4
            backdrop-blur-[2px]
          "
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedPlan(null)
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="workout-modal-title"
            className="
              flex
              w-full
              max-w-2xl
              max-h-[88vh]
              flex-col
              overflow-hidden
              rounded-2xl
              bg-white
              shadow-2xl
            "
          >
            {/* =================================================
                MODAL HEADER
            ================================================== */}

            <div
              className="
                shrink-0
                border-b
                border-slate-200
                bg-white
                px-7
                py-6
              "
            >
              <div className="flex items-start justify-between gap-5">
                <div className="min-w-0">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span
                      className="
                        rounded-full
                        bg-emerald-50
                        px-3
                        py-1.5
                        text-xs
                        font-semibold
                        text-teal-700
                      "
                    >
                      Tuần {selectedPlan.week}
                    </span>

                    <span
                      className="
                        rounded-full
                        bg-emerald-50
                        px-3
                        py-1.5
                        text-xs
                        font-semibold
                        text-teal-700
                      "
                    >
                      Buổi {selectedPlan.order}
                    </span>
                  </div>

                  <h2
                    id="workout-modal-title"
                    className="
                      !m-0
                      !text-slate-900
                      text-2xl
                      font-bold
                    "
                  >
                    {selectedPlan.title}
                  </h2>

                  <p className="mt-1.5 text-sm text-slate-500">Giáo án giảm mỡ</p>
                </div>

                {/* Close */}
                <button
                  type="button"
                  onClick={() => setSelectedPlan(null)}
                  aria-label="Đóng"
                  className="
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-teal-700
                    !text-white
                    text-xl
                    font-bold
                    transition
                    hover:bg-teal-800
                  "
                >
                  ×
                </button>
              </div>
            </div>

            {/* =================================================
                MODAL BODY
            ================================================== */}

            <div
              className="
                min-h-0
                flex-1
                overflow-y-auto
                bg-white
                px-7
                py-5
              "
            >
              <div className="mb-5">
                <p className="text-sm font-medium text-slate-500">
                  {selectedPlan.exercises.length} bài tập trong buổi này
                </p>
              </div>

              <div className="space-y-3">
                {selectedPlan.exercises.map((exercise, index) => (
                  <div
                    key={`${selectedPlan.id}-modal-${exercise.id}`}
                    className="
                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-50
                      p-4
                      transition
                      hover:border-slate-300
                      hover:bg-slate-100
                    "
                  >
                    <div className="flex items-center gap-4">
                      {/* Number */}
                      <div
                        className="
                          flex
                          h-11
                          w-11
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          bg-slate-900
                          !text-white
                          text-sm
                          font-bold
                        "
                      >
                        {index + 1}
                      </div>

                      {/* Exercise */}
                      <div className="min-w-0 flex-1">
                        <h3
                          className="
                            !m-0
                            !text-slate-900
                            text-base
                            font-bold
                          "
                        >
                          {exercise.name}
                        </h3>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <span
                            className="
                              rounded-full
                              bg-white
                              px-3
                              py-1
                              text-xs
                              font-medium
                              text-slate-600
                            "
                          >
                            {exercise.sets} hiệp
                          </span>

                          <span
                            className="
                              rounded-full
                              bg-white
                              px-3
                              py-1
                              text-xs
                              font-medium
                              text-slate-600
                            "
                          >
                            {exercise.reps} reps
                          </span>

                          {exercise.restSeconds > 0 && (
                            <span
                              className="
                                rounded-full
                                bg-white
                                px-3
                                py-1
                                text-xs
                                font-medium
                                text-slate-600
                              "
                            >
                              Nghỉ {exercise.restSeconds}s
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* =================================================
                MODAL FOOTER
            ================================================== */}

            <div
              className="
                shrink-0
                border-t
                border-slate-200
                bg-white
                px-7
                py-4
              "
            >
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="
                  w-full
                  rounded-xl
                  bg-slate-900
                  px-4
                  py-3
                  !text-white
                  text-sm
                  font-semibold
                  transition
                  hover:bg-slate-800
                "
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default WorkoutPlansPage
