from rest_framework import serializers

from .models import Attempt, Exam, Question, QuestionBank


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ["id", "bank", "text", "option_a", "option_b", "option_c", "option_d", "correct_option", "author", "created_at"]
        read_only_fields = ["id", "bank", "author", "created_at"]


class QuestionBankSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    school_class_name = serializers.CharField(source="school_class.name", read_only=True)
    term_name = serializers.CharField(source="term.name", read_only=True)
    approved_by_name = serializers.CharField(source="approved_by.full_name", read_only=True, default=None)
    question_count = serializers.SerializerMethodField()

    class Meta:
        model = QuestionBank
        fields = [
            "id", "subject", "subject_name", "school_class", "school_class_name", "term", "term_name",
            "is_approved", "approved_by", "approved_by_name", "approved_at", "question_count", "created_at",
        ]
        read_only_fields = ["id", "is_approved", "approved_by", "approved_at", "created_at"]

    def get_question_count(self, obj):
        return obj.questions.count()


class QuestionBankDetailSerializer(QuestionBankSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta(QuestionBankSerializer.Meta):
        fields = QuestionBankSerializer.Meta.fields + ["questions"]


class ExamSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    school_class_name = serializers.CharField(source="school_class.name", read_only=True)
    class_arm_label = serializers.SerializerMethodField()
    academic_exam_name = serializers.CharField(source="academic_exam.name", read_only=True)
    bank_question_count = serializers.IntegerField(source="bank.questions.count", read_only=True)
    attempt_count = serializers.SerializerMethodField()

    def get_class_arm_label(self, obj):
        return str(obj.class_arm) if obj.class_arm else None

    class Meta:
        model = Exam
        fields = [
            "id", "title", "academic_exam", "academic_exam_name", "subject", "subject_name",
            "school_class", "school_class_name", "class_arm", "class_arm_label", "bank", "bank_question_count",
            "questions_per_student", "duration_minutes", "auto_submit_penalty", "total_marks",
            "status", "activated_at", "ended_at", "attempt_count", "created_at",
        ]
        read_only_fields = ["id", "status", "activated_at", "ended_at", "created_at"]
        # access_code deliberately excluded — read via the dedicated
        # activate-response only, never listed back on later GETs.

    def get_attempt_count(self, obj):
        return obj.attempts.exclude(status=Attempt.Status.RESET).count()


class ExamActivateResponseSerializer(ExamSerializer):
    access_code = serializers.CharField(read_only=True)

    class Meta(ExamSerializer.Meta):
        fields = ExamSerializer.Meta.fields + ["access_code"]


class AttemptSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.full_name", read_only=True)

    class Meta:
        model = Attempt
        fields = [
            "id", "exam", "student", "student_name", "started_at", "deadline", "submitted_at",
            "raw_score", "penalty_applied", "status", "reset_reason", "created_at",
        ]
        read_only_fields = fields


class AttemptTakeSerializer(serializers.ModelSerializer):
    """What the student sees while sitting the exam — never the correct
    answers, never the running score."""

    questions = serializers.SerializerMethodField()

    class Meta:
        model = Attempt
        fields = ["id", "exam", "started_at", "deadline", "status", "answers", "questions"]

    def get_questions(self, obj):
        by_id = {str(q.id): q for q in Question.objects.filter(id__in=obj.question_ids)}
        return [
            {"id": qid, "text": by_id[qid].text, "options": by_id[qid].options}
            for qid in obj.question_ids if qid in by_id
        ]
