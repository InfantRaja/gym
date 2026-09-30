import { getState, saveState } from './app.js';

document.addEventListener('DOMContentLoaded', () => {
  const weightInput = document.getElementById('weight');
  const profileForm = document.getElementById('profileForm');
  const nutritionForm = document.getElementById('nutritionForm');
  if (!weightInput || !profileForm || !nutritionForm) return;

  const estimateNote = document.createElement('p');
  estimateNote.className = 'small muted target-estimate';
  estimateNote.textContent = 'Change your weight or goal to estimate daily targets. Estimates are general guidance and can be edited.';
  nutritionForm.before(estimateNote);

  function updateTargets() {
    const weight = Number(weightInput.value);
    if (!Number.isFinite(weight) || weight <= 0) return;

    const maintenanceCalories = Math.round(weight * 30);
    const goal = profileForm.querySelector('input[name="goal"]:checked')?.value;
    const deficit = goal === 'Fat Loss' ? Math.min(500, Math.round(maintenanceCalories * 0.2)) : 0;
    const calories = maintenanceCalories - deficit;
    const protein = Math.round(weight * 1.6);
    const fat = Math.round(weight * 0.8);
    const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
    const water = Math.round(weight * 0.035 * 10) / 10;
    const targets = { calories, protein, carbs, fat, water };

    Object.entries(targets).forEach(([key, value]) => {
      document.getElementById(key).value = value;
    });
    const calorieNote = deficit
      ? `${calories} kcal target (${deficit} kcal below estimated maintenance)`
      : `${calories} kcal estimated maintenance`;
    estimateNote.textContent = `Estimated for ${weight} kg: ${calorieNote}; ${protein}g protein, ${carbs}g carbohydrates, ${fat}g fat, ${water}L water. You can edit any target.`;
  }

  weightInput.addEventListener('input', updateTargets);
  profileForm.querySelectorAll('input[name="goal"]').forEach(goalInput => goalInput.addEventListener('change', updateTargets));

  profileForm.addEventListener('submit', () => {
    const current = getState();
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const targets = {
      calories: Number(document.getElementById('calories').value),
      protein: Number(document.getElementById('protein').value),
      carbs: Number(document.getElementById('carbs').value),
      fat: Number(document.getElementById('fat').value),
      water: Number(document.getElementById('water').value)
    };
    const weightHistory = current.weightHistory?.length
      ? [...current.weightHistory]
      : (current.weights || []).map((weight, index, weights) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (weights.length - index - 1) * 7);
        return {
          date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
          weight: Number(weight)
        };
      });
    const todayEntry = weightHistory.find(entry => entry.date === todayKey);
    if (todayEntry) todayEntry.weight = current.profile.weight;
    else weightHistory.push({ date: todayKey, weight: current.profile.weight });
    saveState({ nutrition: { ...current.nutrition, targets }, weightHistory });
  });
});
