import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '@shared/ui/navbar/navbar';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, NavbarComponent],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class LandingComponent {

}
