@component('mail::message')
# New Adoption Inquiry

You received a new inquiry for **{{ $adoption->pet_name }}**.

**From:** {{ $fromName }}
**Email:** {{ $fromEmail }}
@if($fromPhone)
**Phone:** {{ $fromPhone }}
@endif

**Message:**
> {{ $bodyMessage }}

@component('mail::button', ['url' => url(route('adoption.show', $adoption->id))])
View Post
@endcomponent

Thanks,
{{ config('app.name') }}
@endcomponent
