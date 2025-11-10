import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon'; 
import { MatRadioModule } from '@angular/material/radio';
import { CommonModule } from '@angular/common';
import { SelectedOption } from './consts/consts';

@Component({
  selector: 'app-home',
  imports: [FormsModule, MatButtonModule, MatInputModule, MatFormField, MatLabel, MatIconModule, MatRadioModule, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {
  selectedOption: SelectedOption = 'recommend';
}
