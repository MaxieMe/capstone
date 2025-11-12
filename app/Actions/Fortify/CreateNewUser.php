<?php

namespace App\Actions\Fortify;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * Validate and create a new user.
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            'name' => ['required', 'string', 'max:255', 'regex:/^[A-Za-zñÑ\s]+$/u'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique(User::class)],
            'password' => $this->passwordRules(),
            'barangay_permit' => ['required', 'file', 'image', 'max:2048'],
        ])->validate();

        /** @var UploadedFile $file */
        $file = $input['barangay_permit'] ?? null;

        if (!$file instanceof UploadedFile) {
            throw new \Exception('Barangay permit upload failed.');
        }

        $path = $file->store('barangay_permits', 'public');

        return User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => $input['password'],
            'barangay_permit' => $path,
            'is_approved' => false,
        ]);
    }
}
