/**
 * CategoryManager Tests
 * Tests for the CategoryManager implementation
 */

import { CategoryManagerImpl } from '../../../core/categorization/category-manager.js';
import { Category } from '../../../core/categorization/interfaces.js';

describe('CategoryManager', () => {
  let categoryManager: CategoryManagerImpl;

  beforeEach(() => {
    categoryManager = new CategoryManagerImpl();
  });

  test('should add a category', async () => {
    const category = await categoryManager.addCategory({
      name: 'Test Category',
      description: 'A test category'
    });

    expect(category).toBeDefined();
    expect(category.id).toBeDefined();
    expect(category.name).toBe('Test Category');
    expect(category.description).toBe('A test category');
    expect(category.createdAt).toBeInstanceOf(Date);
    expect(category.updatedAt).toBeInstanceOf(Date);
  });

  test('should get a category by ID', async () => {
    const category = await categoryManager.addCategory({
      name: 'Test Category',
      description: 'A test category'
    });

    const retrievedCategory = await categoryManager.getCategory(category.id);
    expect(retrievedCategory).toBeDefined();
    expect(retrievedCategory?.id).toBe(category.id);
    expect(retrievedCategory?.name).toBe('Test Category');
  });

  test('should update a category', async () => {
    const category = await categoryManager.addCategory({
      name: 'Test Category',
      description: 'A test category'
    });

    const updatedCategory = await categoryManager.updateCategory(category.id, {
      name: 'Updated Category',
      description: 'An updated test category'
    });

    expect(updatedCategory).toBeDefined();
    expect(updatedCategory.id).toBe(category.id);
    expect(updatedCategory.name).toBe('Updated Category');
    expect(updatedCategory.description).toBe('An updated test category');
    expect(updatedCategory.updatedAt).not.toEqual(category.updatedAt);
  });

  test('should delete a category', async () => {
    const category = await categoryManager.addCategory({
      name: 'Test Category',
      description: 'A test category'
    });

    const result = await categoryManager.deleteCategory(category.id);
    expect(result).toBe(true);

    const retrievedCategory = await categoryManager.getCategory(category.id);
    expect(retrievedCategory).toBeNull();
  });

  test('should get all categories', async () => {
    await categoryManager.addCategory({
      name: 'Category 1',
      description: 'First test category'
    });

    await categoryManager.addCategory({
      name: 'Category 2',
      description: 'Second test category'
    });

    const categories = await categoryManager.getCategories();
    expect(categories.length).toBeGreaterThanOrEqual(2);
    expect(categories.find(c => c.name === 'Category 1')).toBeDefined();
    expect(categories.find(c => c.name === 'Category 2')).toBeDefined();
  });

  test('should handle parent-child relationships', async () => {
    const parent = await categoryManager.addCategory({
      name: 'Parent Category',
      description: 'Parent test category'
    });

    const child = await categoryManager.addCategory({
      name: 'Child Category',
      description: 'Child test category',
      parent: parent.id
    });

    // Test parent reference in child
    expect(child.parent).toBe(parent.id);

    // Test children array in parent
    const updatedParent = await categoryManager.getCategory(parent.id);
    expect(updatedParent?.children).toContain(child.id);

    // Test getting child categories
    const children = await categoryManager.getChildCategories(parent.id);
    expect(children.length).toBe(1);
    expect(children[0].id).toBe(child.id);
  });

  test('should move a category to a new parent', async () => {
    const parent1 = await categoryManager.addCategory({
      name: 'Parent 1',
      description: 'First parent category'
    });

    const parent2 = await categoryManager.addCategory({
      name: 'Parent 2',
      description: 'Second parent category'
    });

    const child = await categoryManager.addCategory({
      name: 'Child Category',
      description: 'Child test category',
      parent: parent1.id
    });

    // Move to new parent
    const movedChild = await categoryManager.moveCategory(child.id, parent2.id);
    expect(movedChild.parent).toBe(parent2.id);

    // Check old parent's children
    const updatedParent1 = await categoryManager.getCategory(parent1.id);
    expect(updatedParent1?.children).not.toContain(child.id);

    // Check new parent's children
    const updatedParent2 = await categoryManager.getCategory(parent2.id);
    expect(updatedParent2?.children).toContain(child.id);
  });

  test('should initialize with default categories', async () => {
    const categories = await categoryManager.getCategories();
    
    // Check for root categories
    expect(categories.find(c => c.name === 'Technology')).toBeDefined();
    expect(categories.find(c => c.name === 'Business')).toBeDefined();
    expect(categories.find(c => c.name === 'Science')).toBeDefined();
    
    // Check for subcategories
    const techCategory = categories.find(c => c.name === 'Technology');
    if (techCategory && techCategory.children) {
      const techChildren = await categoryManager.getChildCategories(techCategory.id);
      expect(techChildren.length).toBeGreaterThan(0);
      expect(techChildren.find(c => c.name === 'AI & Machine Learning')).toBeDefined();
    }
  });
});